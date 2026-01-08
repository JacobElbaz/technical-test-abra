import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { StocksService } from './stocks.service';
import { GetStocksDto } from './dto/get-stocks.dto';
import { StockDataPoint } from './interface/stocks.interface';

@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get()
  async getStocks(@Query() query: GetStocksDto): Promise<StockDataPoint[]> {
    if (query.symbols.length === 0) {
      throw new HttpException(
        'At least one symbol is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate symbols (basic validation - alphanumeric and common symbols)
    const symbolRegex = /^[A-Z0-9.]+$/;
    for (const symbol of query.symbols) {
      if (!symbolRegex.test(symbol)) {
        throw new HttpException(
          `Invalid symbol format: ${symbol}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    try {
      const data = await this.stocksService.getStocksData(
        query.symbols,
        query.start,
        query.end,
      );
      return data;
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

  @Get('search')
  async searchStocks(@Query('query') query: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      const results = await this.stocksService.searchStocks(query);
      return results;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      // Return empty array on error instead of throwing
      return [];
    }
  }
}
