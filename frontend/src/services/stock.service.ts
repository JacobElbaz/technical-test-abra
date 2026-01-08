import api from '../api/axios';
import type { StockDataPoint, DateRange } from '../types/stock.types';

export const stockService = {
  /**
   * Get stock data for multiple symbols
   */
  async getStockData(
    symbols: string[],
    dateRange: DateRange,
  ): Promise<StockDataPoint[]> {
    const symbolsParam = symbols.join(',');
    const response = await api.get<StockDataPoint[]>('/stocks', {
      params: {
        symbols: symbolsParam,
        start: dateRange.start,
        end: dateRange.end,
      },
    });
    return response.data;
  },

  /**
   * Calculate default date range (36 months back from today)
   */
  getDefaultDateRange(): DateRange {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 36);

    return {
      start: this.formatDate(start),
      end: this.formatDate(end),
    };
  },

  /**
   * Format date as YYYY-MM-DD
   */
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
};
