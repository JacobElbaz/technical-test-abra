export interface StockDataPoint {
  date: string;
  [symbol: string]: string | number;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange?: string;
  type?: string;
}

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}
