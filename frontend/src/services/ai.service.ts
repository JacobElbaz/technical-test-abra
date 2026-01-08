import api from '../api/axios';
import type { DateRange } from '../types/stock.types';

export interface AIQueryRequest {
  question: string;
  symbols: string[];
  dateRange: DateRange;
}

export interface AIQueryResponse {
  answer: string;
  question: string;
  symbols: string[];
  dateRange: DateRange;
}

export const aiService = {
  /**
   * Ask a question to the AI stock agent
   */
  async askQuestion(
    question: string,
    symbols: string[],
    dateRange: DateRange,
  ): Promise<string> {
    const request: AIQueryRequest = {
      question,
      symbols,
      dateRange,
    };

    const response = await api.post<AIQueryResponse>('/stocks/ai-query', request);
    return response.data.answer;
  },
};
