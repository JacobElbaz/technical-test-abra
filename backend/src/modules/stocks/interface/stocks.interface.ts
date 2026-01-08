export interface TwelveDataResponse {
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

export interface SearchResponse {
    status?: string;
    data?: Array<{
      symbol?: string;
      instrument_name?: string;
      name?: string;
      exchange?: string;
      mic_code?: string;
      type?: string;
    }>;
  }

  export interface StockDataPoint {
    date: string;
    [symbol: string]: string | number;
  }
