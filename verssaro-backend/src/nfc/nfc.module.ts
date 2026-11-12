import {
  Body,
  Controller,
  Get,
  Headers,
  Module,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AdminNfcActionDto,
  BatchMintNfcDto,
  BindNfcDto,
  ScanNfcDto,
  TransferNfcDto,
} from './nfc.dto';
import { NfcService } from './nfc.service';

@ApiTags('nfc')
@Controller('nfc')
export class NfcController {
  constructor(private readonly nfcService: NfcService) {}

  @Get('vault')
  getVault(@Headers('authorization') authHeader?: string) {
    return this.nfcService.getVault(authHeader);
  }

  @Post('scan')
  scan(
    @Body() dto: ScanNfcDto,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.nfcService.scanChip(dto, authHeader);
  }

  @Post('bind')
  bind(
    @Body() dto: BindNfcDto,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.nfcService.bindToVault(dto.artifactIdOrUid, authHeader);
  }

  @Post('transfer')
  transfer(
    @Body() dto: TransferNfcDto,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.nfcService.transferProvenance(dto, authHeader);
  }

  @Post('care-pass')
  redeemCarePass(@Headers('authorization') authHeader?: string) {
    return this.nfcService.redeemCarePass(authHeader);
  }

  @Get('ledger')
  getLedger(@Query('eventType') eventType?: string) {
    return this.nfcService.getGlobalLedger(eventType);
  }

  @Get('admin/inventory')
  adminInventory(@Query('status') status?: string, @Query('q') q?: string) {
    return this.nfcService.adminInventory(status, q);
  }

  @Post('admin/batch-mint')
  batchMint(@Body() dto: BatchMintNfcDto) {
    return this.nfcService.batchMint(dto);
  }

  @Patch('admin/:id')
  adminAction(@Param('id') id: string, @Body() dto: AdminNfcActionDto) {
    return this.nfcService.adminAction(id, dto);
  }
}

@Module({
  controllers: [NfcController],
  providers: [NfcService],
  exports: [NfcService],
})
export class NfcModule {}

