import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  format,
  parse,
} from 'date-fns';
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
   * Generates reference dates based on interval using date-fns and applies forward fill for missing dates
   */
  private mergeStockData(
    stocksData: Array<{ symbol: string; data: TwelveDataResponse }>,
    startDate: string,
    endDate: string,
    interval: string,
  ): StockDataPoint[] {
    // Parse start and end dates
    const start = parse(startDate, 'yyyy-MM-dd', new Date());
    const end = parse(endDate, 'yyyy-MM-dd', new Date());

    // Generate reference dates based on interval using date-fns
    let referenceDates: Date[];
    if (interval === '1day') {
      referenceDates = eachDayOfInterval({ start, end });
    } else if (interval === '1week') {
      referenceDates = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
    } else if (interval === '1month') {
      referenceDates = eachMonthOfInterval({ start, end });
    } else {
      // Fallback to daily if interval is unknown
      referenceDates = eachDayOfInterval({ start, end });
    }

    // Format dates to YYYY-MM-DD and filter to only include dates within [startDate, endDate]
    const formattedDates = referenceDates
      .map((date) => format(date, 'yyyy-MM-dd'))
      .filter((date) => date >= startDate && date <= endDate);

    // Create a Set to ensure uniqueness and add startDate and endDate if not present
    const dateSet = new Set<string>(formattedDates);

    // Add startDate if it's not already present
    if (!dateSet.has(startDate)) {
      dateSet.add(startDate);
    }

    // Add endDate if it's not already present
    if (!dateSet.has(endDate)) {
      dateSet.add(endDate);
    }

    // Convert to array and sort chronologically
    const allDates = Array.from(dateSet).sort((a, b) => a.localeCompare(b));

    // Create a Map to index API data by date for quick access
    // Map<date, Map<symbol, value>>
    const apiDataMap = new Map<string, Map<string, number>>();

    // Extract symbols from stocksData
    const symbols = stocksData.map(({ symbol }) => symbol);

    // Fill the API data map
    stocksData.forEach(({ symbol, data }) => {
      if (data.values && Array.isArray(data.values)) {
        data.values.forEach((value) => {
          // Extract date part from datetime (format: "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DD")
          const apiDate = value.datetime.includes(' ')
            ? value.datetime.split(' ')[0]
            : value.datetime;

          // Validate date format
          if (!/^\d{4}-\d{2}-\d{2}$/.test(apiDate)) {
            console.warn(`Invalid date format: ${value.datetime}`);
            return;
          }

          // Store the value in the map
          if (!apiDataMap.has(apiDate)) {
            apiDataMap.set(apiDate, new Map<string, number>());
          }

          const closePrice = parseFloat(value.close);
          if (!isNaN(closePrice)) {
            apiDataMap.get(apiDate)!.set(symbol, closePrice);
          }
        });
      }
    });

    // Initialize result map with all reference dates
    const resultMap = new Map<string, StockDataPoint>();
    allDates.forEach((date) => {
      resultMap.set(date, { date });
    });

    // For each reference date, check if API has a value for this exact date
    allDates.forEach((date) => {
      const dataPoint = resultMap.get(date)!;
      const apiValues = apiDataMap.get(date);

      if (apiValues) {
        // API has data for this date, use it
        symbols.forEach((symbol) => {
          const value = apiValues.get(symbol);
          if (value !== undefined) {
            dataPoint[symbol] = value;
          }
        });
      }
      // If no API data for this date, leave undefined temporarily (will be filled with forward fill)
    });

    // Find first known value for each symbol (for backward fill)
    const firstKnownValues = new Map<string, number>();
    allDates.forEach((date) => {
      const dataPoint = resultMap.get(date)!;
      symbols.forEach((symbol) => {
        const currentValue = dataPoint[symbol];
        if (
          currentValue !== undefined &&
          typeof currentValue === 'number' &&
          !firstKnownValues.has(symbol)
        ) {
          firstKnownValues.set(symbol, currentValue);
        }
      });
    });

    // Apply forward fill: for each date without value, use the last known value
    // Also apply backward fill: for dates before first value, use first known value
    const lastKnownValues = new Map<string, number>();

    allDates.forEach((date) => {
      const dataPoint = resultMap.get(date)!;

      symbols.forEach((symbol) => {
        const currentValue = dataPoint[symbol];
        if (currentValue !== undefined && typeof currentValue === 'number') {
          // Update last known value for this symbol
          lastKnownValues.set(symbol, currentValue);
        } else {
          // No value for this date, try to fill it
          if (lastKnownValues.has(symbol)) {
            // Apply forward fill: use last known value (last trading day)
            const lastValue = lastKnownValues.get(symbol);
            if (lastValue !== undefined) {
              dataPoint[symbol] = lastValue;
            }
          } else if (firstKnownValues.has(symbol)) {
            // Apply backward fill: use first known value for dates before first available data
            const firstValue = firstKnownValues.get(symbol);
            if (firstValue !== undefined) {
              dataPoint[symbol] = firstValue;
            }
          }
          // If no value exists at all, leave it undefined (will be omitted in JSON)
        }
      });
    });

    // Return sorted array (already sorted by date)
    return allDates.map((date) => resultMap.get(date)!);
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
      return this.mergeStockData(stocksData, startDate, endDate, interval);
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
