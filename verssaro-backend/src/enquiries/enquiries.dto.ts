import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateEnquiryItemDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  size!: string;

  @IsOptional()
  @IsString()
  colorName?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateEnquiryDto {
  @IsNotEmpty()
  @IsString()
  customerName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEnquiryItemDto)
  items!: CreateEnquiryItemDto[];
}

export class UpdateEnquiryStatusDto {
  @IsNotEmpty()
  @IsString()
  status!: string;
}
