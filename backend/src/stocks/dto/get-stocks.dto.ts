import { IsString, IsNotEmpty, Matches, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetStocksDto {
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter((s) => s.length > 0);
    }
    return Array.isArray(value) ? value : [];
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  symbols: string[];

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'start must be in YYYY-MM-DD format',
  })
  start: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'end must be in YYYY-MM-DD format',
  })
  end: string;
}
