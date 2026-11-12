import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

export class CreateAddressDto {
  @IsString()
  label!: string;

  @IsOptional()
  @IsIn(['RESIDENTIAL', 'OFFICE', 'PRIVATE_VAULT'])
  classification?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsString()
  recipientName!: string;

  @IsOptional()
  @IsString()
  company?: string;

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

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  carrierPreference?: string;

  @IsOptional()
  @IsString()
  deliveryInstructions?: string;

  @IsOptional()
  @IsString()
  packagingSpec?: string;
}

@Injectable()
export class AddressesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async list(authHeader?: string) {
    const user = await this.authService.resolveUserFromTokenOrDefault(authHeader);
    const addresses = await this.prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return { addresses, userId: user.id };
  }

  async create(authHeader: string | undefined, dto: CreateAddressDto) {
    const user = await this.authService.resolveUserFromTokenOrDefault(authHeader);
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.create({
      data: {
        userId: user.id,
        label: dto.label.trim().toUpperCase(),
        classification: dto.classification || 'RESIDENTIAL',
        isDefault: Boolean(dto.isDefault),
        recipientName: dto.recipientName.trim(),
        company: dto.company?.trim() || null,
        addressLine1: dto.addressLine1.trim(),
        addressLine2: dto.addressLine2?.trim() || null,
        city: dto.city.trim(),
        province: dto.province?.trim() || null,
        postalCode: dto.postalCode.trim(),
        country: dto.country.trim(),
        countryCode: (dto.countryCode || 'LK').toUpperCase().slice(0, 2),
        phone: dto.phone.trim(),
        carrierPreference:
          dto.carrierPreference?.trim() || 'DHL EXPRESS PRIORITY DDP',
        deliveryInstructions: dto.deliveryInstructions?.trim() || null,
        packagingSpec: dto.packagingSpec || 'ARCHIVAL_MONOLITH_BOX',
        coordinates: '6.9271° N, 79.8612° E',
      },
    });
  }

  async setDefault(authHeader: string | undefined, id: string) {
    const user = await this.authService.resolveUserFromTokenOrDefault(authHeader);
    const addr = await this.prisma.address.findFirst({
      where: { id, userId: user.id },
    });
    if (!addr) throw new NotFoundException('Address not found');

    await this.prisma.address.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    });
    return this.prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  async update(
    authHeader: string | undefined,
    id: string,
    dto: Partial<CreateAddressDto>,
  ) {
    const user = await this.authService.resolveUserFromTokenOrDefault(authHeader);
    const addr = await this.prisma.address.findFirst({
      where: { id, userId: user.id },
    });
    if (!addr) throw new NotFoundException('Address not found');

    return this.prisma.address.update({
      where: { id },
      data: {
        ...(dto.label ? { label: dto.label.trim().toUpperCase() } : {}),
        ...(dto.classification ? { classification: dto.classification } : {}),
        ...(dto.recipientName ? { recipientName: dto.recipientName.trim() } : {}),
        ...(dto.addressLine1 ? { addressLine1: dto.addressLine1.trim() } : {}),
        ...(dto.addressLine2 !== undefined
          ? { addressLine2: dto.addressLine2?.trim() || null }
          : {}),
        ...(dto.city ? { city: dto.city.trim() } : {}),
        ...(dto.postalCode ? { postalCode: dto.postalCode.trim() } : {}),
        ...(dto.country ? { country: dto.country.trim() } : {}),
        ...(dto.phone ? { phone: dto.phone.trim() } : {}),
        ...(dto.carrierPreference
          ? { carrierPreference: dto.carrierPreference.trim() }
          : {}),
        ...(dto.deliveryInstructions !== undefined
          ? { deliveryInstructions: dto.deliveryInstructions?.trim() || null }
          : {}),
        ...(dto.packagingSpec ? { packagingSpec: dto.packagingSpec } : {}),
      },
    });
  }

  async remove(authHeader: string | undefined, id: string) {
    const user = await this.authService.resolveUserFromTokenOrDefault(authHeader);
    const addr = await this.prisma.address.findFirst({
      where: { id, userId: user.id },
    });
    if (!addr) throw new NotFoundException('Address not found');
    await this.prisma.address.delete({ where: { id } });
    return { deleted: true, id };
  }
}

@ApiTags('addresses')
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  list(@Headers('authorization') authHeader?: string) {
    return this.addressesService.list(authHeader);
  }

  @Post()
  create(
    @Headers('authorization') authHeader: string | undefined,
    @Body() dto: CreateAddressDto,
  ) {
    return this.addressesService.create(authHeader, dto);
  }

  @Patch(':id/default')
  setDefault(
    @Headers('authorization') authHeader: string | undefined,
    @Param('id') id: string,
  ) {
    return this.addressesService.setDefault(authHeader, id);
  }

  @Patch(':id')
  update(
    @Headers('authorization') authHeader: string | undefined,
    @Param('id') id: string,
    @Body() dto: Partial<CreateAddressDto>,
  ) {
    return this.addressesService.update(authHeader, id, dto);
  }

  @Delete(':id')
  remove(
    @Headers('authorization') authHeader: string | undefined,
    @Param('id') id: string,
  ) {
    return this.addressesService.remove(authHeader, id);
  }
}

@Module({
  controllers: [AddressesController],
  providers: [AddressesService],
  exports: [AddressesService],
})
export class AddressesModule {}

