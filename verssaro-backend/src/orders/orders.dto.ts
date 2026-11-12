import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  customerName!: string;

  @IsString()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  addressLine1!: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  city!: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsString()
  postalCode!: string;

  @IsString()
  country!: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsIn(['colombo_same_day', 'dhl_express'])
  shippingMethod?: string;

  @IsOptional()
  @IsIn(['card', 'klarna', 'cod', 'crypto'])
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  giftMessage?: string;
}

export class UpdateOrderStatusDto {
  @IsIn(['UNFULFILLED', 'PROCESSING_QC', 'DISPATCHED', 'DELIVERED', 'HOLD'])
  status!: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;
}

