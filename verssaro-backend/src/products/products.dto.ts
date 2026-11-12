import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @IsString()
  authorName!: string;

  @IsOptional()
  @IsString()
  authorLocation?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsIn(['runs_small', 'true_to_size', 'oversized'])
  fitFeedback?: string;

  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsString()
  sizePurchased?: string;

  @IsOptional()
  @IsString()
  colorPurchased?: string;
}

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsString()
  sku!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  categoryLabel?: string;

  @IsOptional()
  @IsString()
  capsule?: string;

  @IsOptional()
  @IsString()
  editionLabel?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  priceUsd!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  cogsUsd!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  gsm?: number;

  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @IsString()
  silhouette?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @IsIn(['LIVE', 'UPCOMING', 'DRAFT', 'SOLD_OUT'])
  status?: string;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsArray()
  colorways?: { name: string; hex: string; slug: string }[];

  @IsOptional()
  @IsArray()
  sizes?: {
    size: string;
    stock: number;
    colombo: number;
    london: number;
    dubai: number;
  }[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceUsd?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cogsUsd?: number;

  @IsOptional()
  @IsString()
  capsule?: string;

  @IsOptional()
  @IsString()
  badge?: string | null;

  @IsOptional()
  @IsIn(['LIVE', 'UPCOMING', 'DRAFT', 'SOLD_OUT'])
  status?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsArray()
  sizes?: {
    size: string;
    stock: number;
    colombo: number;
    london: number;
    dubai: number;
  }[];
}

export class BatchPriceAdjustDto {
  @IsOptional()
  @IsString()
  category?: string;

  @Type(() => Number)
  @IsNumber()
  percentDelta!: number;
}

