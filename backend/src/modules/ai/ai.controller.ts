import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AIService } from './ai.service';
import { StocksService } from '../stocks/stocks.service';
import { AIQueryDto } from './dto/ai-query.dto';

@Controller('stocks')
export class AIController {
  constructor(
    private readonly aiService: AIService,
    private readonly stocksService: StocksService,
  ) {}

  @Post('ai-query')
  async queryAI(@Body() queryDto: AIQueryDto) {
    try {
      // Validate that we have stock data
      if (!queryDto.symbols || queryDto.symbols.length === 0) {
        throw new HttpException(
          'At least one stock symbol is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Fetch current stock data for the symbols and date range
      const stockData = await this.stocksService.getStocksData(
        queryDto.symbols,
        queryDto.dateRange.start,
        queryDto.dateRange.end,
      );

      if (!stockData || stockData.length === 0) {
        throw new HttpException(
          'No stock data available for the selected symbols and date range',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Call AI service to analyze the data
      const aiResponse = await this.aiService.analyzeStockData(
        queryDto.question,
        stockData,
        queryDto.symbols,
        queryDto.dateRange,
      );

      return {
        answer: aiResponse,
        question: queryDto.question,
        symbols: queryDto.symbols,
        dateRange: queryDto.dateRange,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to process AI query',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
