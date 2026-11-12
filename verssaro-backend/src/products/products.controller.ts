import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  BatchPriceAdjustDto,
  CreateProductDto,
  CreateReviewDto,
  UpdateProductDto,
} from './products.dto';
import { ProductFilterQuery, ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: ProductFilterQuery) {
    return this.productsService.findAll(query);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Post(':slug/reviews')
  addReview(@Param('slug') slug: string, @Body() dto: CreateReviewDto) {
    return this.productsService.addReview(slug, dto);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Post('batch-price')
  batchAdjust(@Body() dto: BatchPriceAdjustDto) {
    return this.productsService.batchAdjustPrices(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}

