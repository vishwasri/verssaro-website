import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class AddCartItemDto {
  @IsString()
  productId!: string;

  @IsString()
  size!: string;

  @IsOptional()
  @IsString()
  colorName?: string;

  @IsOptional()
  @IsString()
  colorHex?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  quantity?: number;
}

export class AddBundleDto {
  @IsArray()
  items!: AddCartItemDto[];
}

export class UpdateCartItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  quantity!: number;
}

export class ApplyPromoDto {
  @IsString()
  code!: string;
}

export class UpdateCartMetaDto {
  @IsOptional()
  @IsBoolean()
  collectorBox?: boolean;

  @IsOptional()
  @IsString()
  giftMessage?: string;
}

