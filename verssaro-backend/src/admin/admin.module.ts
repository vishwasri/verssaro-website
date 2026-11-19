import {
  Body,
  Controller,
  Get,
  Module,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AdminService,
  CreatePromoDto,
  CreateVipClientDto,
  NewsletterDto,
  UpdatePromoStatusDto,
  UpdateVipClientDto,
} from './admin.service';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardTelemetry();
  }

  @Get('inventory')
  getInventory() {
    return this.adminService.getInventoryMatrix();
  }

  @Get('clients')
  listClients(@Query('tier') tier?: string, @Query('q') q?: string) {
    return this.adminService.listClients(tier, q);
  }

  @Post('clients')
  createClient(@Body() dto: CreateVipClientDto) {
    return this.adminService.createVipClient(dto);
  }

  @Patch('clients/:id')
  updateClient(@Param('id') id: string, @Body() dto: UpdateVipClientDto) {
    return this.adminService.updateVipClient(id, dto);
  }

  @Get('promotions')
  listPromotions(@Query('type') type?: string, @Query('q') q?: string) {
    return this.adminService.listPromotions(type, q);
  }

  @Post('promotions')
  createPromotion(@Body() dto: CreatePromoDto) {
    return this.adminService.createPromotion(dto);
  }

  @Patch('promotions/:id')
  updatePromotionStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePromoStatusDto,
  ) {
    return this.adminService.updatePromotionStatus(id, dto);
  }
}

@ApiTags('newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  subscribe(@Body() dto: NewsletterDto) {
    return this.adminService.subscribeNewsletter(dto);
  }
}

@Module({
  controllers: [AdminController, NewsletterController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
