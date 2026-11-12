import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ScanNfcDto {
  @IsOptional()
  @IsString()
  uid?: string;
}

export class BindNfcDto {
  @IsString()
  artifactIdOrUid!: string;
}

export class TransferNfcDto {
  @IsString()
  artifactId!: string;

  @IsString()
  recipientInput!: string;

  @IsIn(['HEX', 'VIP_HANDLE', 'ESCROW'])
  transferMethod!: string;
}

export class BatchMintNfcDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  count?: number;

  @IsOptional()
  @IsString()
  warehouseNode?: string;
}

export class AdminNfcActionDto {
  @IsIn(['RESYNC', 'BURN', 'ACTIVATE'])
  action!: string;
}

