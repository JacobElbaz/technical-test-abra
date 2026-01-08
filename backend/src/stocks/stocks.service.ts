import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { SearchResponse, TwelveDataResponse, StockDataPoint } from './interface/stocks.interface';

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
   * Generate all dates between startDate and endDate (inclusive)
   */
  private generateDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Set time to midnight to avoid timezone issues
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
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
   * Generates all dates in the range and applies forward fill for missing dates
   */
  private mergeStockData(
    stocksData: Array<{ symbol: string; data: TwelveDataResponse }>,
    startDate: string,
    endDate: string,
  ): StockDataPoint[] {
    // Generate all dates in the range
    const allDates = this.generateDateRange(startDate, endDate);
    const dateMap = new Map<string, StockDataPoint>();

    // Initialize all dates in the range
    allDates.forEach((date) => {
      dateMap.set(date, { date });
    });

    // Extract symbols from stocksData
    const symbols = stocksData.map(({ symbol }) => symbol);

    // Fill in data from API responses
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

          // Only process dates within our range
          if (dateMap.has(date)) {
            const closePrice = parseFloat(value.close);
            if (!isNaN(closePrice)) {
              dateMap.get(date)![symbol] = closePrice;
            }
          }
        });
      }
    });

    // Apply forward fill: for each date without data, use the last known value
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) =>
      a.localeCompare(b),
    );

    // Track last known value for each symbol
    const lastKnownValues = new Map<string, number>();

    sortedDates.forEach((date) => {
      const dataPoint = dateMap.get(date)!;

      symbols.forEach((symbol) => {
        if (
          dataPoint[symbol] !== undefined &&
          typeof dataPoint[symbol] === 'number'
        ) {
          // Update last known value for this symbol
          lastKnownValues.set(symbol, dataPoint[symbol] as number);
        } else if (lastKnownValues.has(symbol)) {
          // Apply forward fill: use last known value
          const lastValue = lastKnownValues.get(symbol);
          if (lastValue !== undefined) {
            dataPoint[symbol] = lastValue;
          }
        }
        // If no last known value exists, leave it undefined (will be omitted in JSON)
      });
    });

    // Return sorted array (already sorted by date)
    return sortedDates.map((date) => dateMap.get(date)!);
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

      // Merge data by date with forward fill for missing dates
      return this.mergeStockData(stocksData, startDate, endDate);
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

  /**
   * Search for stocks by symbol or name
   */
  async searchStocks(query: string): Promise<
    Array<{
      symbol: string;
      name: string;
      exchange?: string;
      type?: string;
    }>
  > {
    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<SearchResponse>(`${this.baseUrl}/symbol_search`, {
          params: {
            symbol: query.trim().toUpperCase(),
            apikey: this.apiKey,
          },
        }),
      );

      if (response.data.status === 'error') {
        // If API returns error, return empty array instead of throwing
        return [];
      }

      // Twelve Data symbol_search returns array of symbols
      const results = Array.isArray(response.data.data)
        ? response.data.data
        : [];

      return results.map((item) => ({
        symbol: item.symbol || item.instrument_name || '',
        name: item.instrument_name || item.name || item.symbol || '',
        exchange: item.exchange || item.mic_code || undefined,
        type: item.type || undefined,
      }));
    } catch (error) {
      // If search fails, return empty array (don't throw error)
      console.warn('Stock search failed:', error);
      return [];
    }
  }
}
