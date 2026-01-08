import api from '../api/axios';
import type { StockSearchResult } from '../types/stock.types';

export const stockSearchService = {
  /**
   * Search for stocks by query
   */
  async searchStocks(query: string): Promise<StockSearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      const response = await api.get<StockSearchResult[]>('/stocks/search', {
        params: {
          query: query.trim().toUpperCase(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching stocks:', error);
      return [];
    }
  },
};
