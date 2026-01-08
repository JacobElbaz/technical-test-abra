import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { StockDataPoint } from '../stocks/interface/stocks.interface';

@Injectable()
export class AIService {
  private readonly genAI: GoogleGenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    // The client gets the API key from the environment variable GEMINI_API_KEY
    // But we can also pass it explicitly if needed
    this.genAI = new GoogleGenAI({ apiKey });
  }

  /**
   * Format stock data into a structured prompt for Gemini
   */
  private formatStockDataForPrompt(
    stockData: StockDataPoint[],
    symbols: string[],
    dateRange: { start: string; end: string },
  ): string {
    if (!stockData || stockData.length === 0) {
      return 'No stock data available.';
    }

    // Calculate summary statistics for each stock
    const stockSummaries = symbols.map((symbol) => {
      const values = stockData
        .map((point) => {
          const value = point[symbol];
          return typeof value === 'number' ? value : null;
        })
        .filter((v): v is number => v !== null);

      if (values.length === 0) {
        return null;
      }

      const firstValue = values[0];
      const lastValue = values[values.length - 1];
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const change = lastValue - firstValue;
      const changePercent = ((change / firstValue) * 100).toFixed(2);

      // Get recent trend (last 10% of data points)
      const recentStartIndex = Math.floor(values.length * 0.9);
      const recentValues = values.slice(recentStartIndex);
      const recentFirst = recentValues[0];
      const recentLast = recentValues[recentValues.length - 1];
      const recentTrend =
        recentLast > recentFirst ? 'upward' : recentLast < recentFirst ? 'downward' : 'stable';

      return {
        symbol,
        firstValue: firstValue.toFixed(2),
        lastValue: lastValue.toFixed(2),
        minValue: minValue.toFixed(2),
        maxValue: maxValue.toFixed(2),
        change: change.toFixed(2),
        changePercent,
        recentTrend,
        dataPoints: values.length,
      };
    }).filter((summary): summary is NonNullable<typeof summary> => summary !== null);

    // Build the prompt
    let prompt = `Stock Market Analysis Data\n\n`;
    prompt += `Date Range: ${dateRange.start} to ${dateRange.end}\n\n`;
    prompt += `Stocks Analyzed: ${symbols.join(', ')}\n\n`;
    prompt += `Summary Statistics:\n`;

    stockSummaries.forEach((summary) => {
      prompt += `\n${summary.symbol}:\n`;
      prompt += `  - First Value (${dateRange.start}): $${summary.firstValue}\n`;
      prompt += `  - Last Value (${dateRange.end}): $${summary.lastValue}\n`;
      prompt += `  - Minimum: $${summary.minValue}\n`;
      prompt += `  - Maximum: $${summary.maxValue}\n`;
      prompt += `  - Total Change: $${summary.change} (${summary.changePercent}%)\n`;
      prompt += `  - Recent Trend: ${summary.recentTrend}\n`;
      prompt += `  - Data Points: ${summary.dataPoints}\n`;
    });

    // Add sample of recent data points
    prompt += `\n\nRecent Data Points (last 10):\n`;
    const recentData = stockData.slice(-10);
    recentData.forEach((point) => {
      prompt += `\nDate: ${point.date}\n`;
      symbols.forEach((symbol) => {
        const value = point[symbol];
        if (typeof value === 'number') {
          prompt += `  ${symbol}: $${value.toFixed(2)}\n`;
        }
      });
    });

    return prompt;
  }

  /**
   * Analyze stock data using Gemini AI
   */
  async analyzeStockData(
    question: string,
    stockData: StockDataPoint[],
    symbols: string[],
    dateRange: { start: string; end: string },
  ): Promise<string> {
    try {
      // Format the stock data into a prompt
      const dataPrompt = this.formatStockDataForPrompt(stockData, symbols, dateRange);

      // Create the full prompt
      const fullPrompt = `${dataPrompt}\n\nQuestion: ${question}\n\nPlease provide a detailed analysis and answer to this question based on the stock data provided above.`;

      // Get model name from config or use default
      const modelName = this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.5-flash';

      // Call Gemini API using the new SDK
      const response = await this.genAI.models.generateContent({
        model: modelName,
        contents: fullPrompt,
      });

      const text = response.text;

      if (!text || text.trim().length === 0) {
        throw new HttpException(
          'AI service returned an empty response',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return text;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Gemini API error:', error);
      throw new HttpException(
        `Failed to get AI analysis: ${error.message || 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
