import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateEnquiryDto, UpdateEnquiryStatusDto } from './enquiries.dto';
import { EnquiriesService } from './enquiries.service';

@ApiTags('enquiries')
@Controller('enquiries')
export class EnquiriesController {
  constructor(private readonly enquiriesService: EnquiriesService) {}

  @Post()
  create(@Body() dto: CreateEnquiryDto) {
    return this.enquiriesService.createEnquiry(dto);
  }

  @Get()
  findAll() {
    return this.enquiriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enquiriesService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEnquiryStatusDto,
  ) {
    return this.enquiriesService.updateStatus(id, dto);
  }
}
