import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface TwelveDataResponse {
  meta: {
    symbol: string;
    interval: string;
    currency: string;
    exchange_timezone: string;
    exchange: string;
    mic_code: string;
    type: string;
  };
  values: Array<{
    datetime: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }>;
  status: string;
  message?: string;
}

export interface StockDataPoint {
  date: string;
  [symbol: string]: string | number;
}

@Injectable()
export class StocksService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.twelvedata.com';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('TWELVE_DATA_API_KEY') || '';
    if (!this.apiKey) {
      console.warn('TWELVE_DATA_API_KEY is not set. API calls will fail.');
    }
  }

  /**
   * Calculate the appropriate interval based on date range
   */
  private calculateInterval(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const monthsDiff =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());

    if (monthsDiff <= 3) {
      return '1day';
    } else if (monthsDiff <= 12) {
      return '1week';
    } else {
      return '1month';
    }
  }

  /**
   * Validate date range (max 36 months)
   */
  private validateDateRange(startDate: string, endDate: string): void {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const monthsDiff =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());

    if (monthsDiff > 36) {
      throw new HttpException(
        'Date range cannot exceed 36 months',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (start > end) {
      throw new HttpException(
        'Start date must be before end date',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Fetch stock data from Twelve Data API
   */
  private async fetchStockData(
    symbol: string,
    startDate: string,
    endDate: string,
    interval: string,
  ): Promise<TwelveDataResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<TwelveDataResponse>(`${this.baseUrl}/time_series`, {
          params: {
            symbol,
            interval,
            start_date: startDate,
            end_date: endDate,
            apikey: this.apiKey,
            format: 'JSON',
          },
        }),
      );

      if (response.data.status === 'error') {
        throw new HttpException(
          response.data.message || `Failed to fetch data for ${symbol}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      return response.data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (error.response?.status === 429) {
        throw new HttpException(
          'Rate limit exceeded. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new HttpException(
        `Failed to fetch data for ${symbol}: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Merge stock data by date for Recharts format
   */
  private mergeStockData(
    stocksData: Array<{ symbol: string; data: TwelveDataResponse }>,
  ): StockDataPoint[] {
    const dateMap = new Map<string, StockDataPoint>();

    stocksData.forEach(({ symbol, data }) => {
      if (data.values && Array.isArray(data.values)) {
        data.values.forEach((value) => {
          // Extract date part from datetime (format: "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DD")
          const date = value.datetime.includes(' ')
            ? value.datetime.split(' ')[0]
            : value.datetime;

          // Validate date format
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            console.warn(`Invalid date format: ${value.datetime}`);
            return;
          }

          if (!dateMap.has(date)) {
            dateMap.set(date, { date });
          }

          const closePrice = parseFloat(value.close);
          if (!isNaN(closePrice)) {
            dateMap.get(date)![symbol] = closePrice;
          }
        });
      }
    });

    // Sort by date in ascending order (oldest to newest)
    // Twelve Data API returns data in descending order (newest to oldest),
    // so we need to sort to ensure the chart displays correctly
    return Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }

  /**
   * Get stock data for multiple symbols
   */
  async getStocksData(
    symbols: string[],
    startDate: string,
    endDate: string,
  ): Promise<StockDataPoint[]> {
    // Validate date range
    this.validateDateRange(startDate, endDate);

    // Calculate interval based on date range
    const interval = this.calculateInterval(startDate, endDate);

    // Fetch data for all symbols in parallel
    const fetchPromises = symbols.map((symbol) =>
      this.fetchStockData(symbol, startDate, endDate, interval).then(
        (data) => ({ symbol, data }),
      ),
    );

    try {
      const stocksData = await Promise.all(fetchPromises);

      // Merge data by date
      return this.mergeStockData(stocksData);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch stock data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

