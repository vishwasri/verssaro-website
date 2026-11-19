import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnquiryDto, UpdateEnquiryStatusDto } from './enquiries.dto';

@Injectable()
export class EnquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  async createEnquiry(dto: CreateEnquiryDto, userId?: string) {
    const randomCode = Math.floor(1000 + Math.random() * 8999);
    const enquiryCode = `ENQ-${new Date().getFullYear()}-${randomCode}`;

    return this.prisma.enquiry.create({
      data: {
        enquiryCode,
        userId: userId || null,
        customerName: dto.customerName.trim(),
        email: dto.email?.trim() || null,
        phone: dto.phone?.trim() || null,
        notes: dto.notes?.trim() || null,
        source: dto.source || 'WEBSITE_DRAWER',
        items: {
          create: dto.items.map((it) => ({
            productId: it.productId || null,
            name: it.name.trim(),
            size: it.size.trim(),
            colorName: it.colorName?.trim() || 'Black',
            quantity: it.quantity || 1,
          })),
        },
      },
      include: { items: true },
    });
  }

  async findAll() {
    return this.prisma.enquiry.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const enquiry = await this.prisma.enquiry.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!enquiry) {
      throw new NotFoundException(`Enquiry #${id} not found`);
    }
    return enquiry;
  }

  async updateStatus(id: string, dto: UpdateEnquiryStatusDto) {
    return this.prisma.enquiry.update({
      where: { id },
      data: { status: dto.status },
      include: { items: true },
    });
  }
}
