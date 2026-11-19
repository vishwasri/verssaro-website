import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from './prisma.service';
import { SEED_PRODUCTS } from './seed.data';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureSeeded();
  }

  async ensureSeeded() {
    const productCount = await this.prisma.product.count();
    if (productCount > 0) {
      return;
    }

    this.logger.log('Seeding VERSSARO luxury heritage database...');

    const passwordHash = await bcrypt.hash('verssaro2025', 10);

    const alexander = await this.prisma.user.create({
      data: {
        email: 'alexander.wright@verssaro.vip',
        passwordHash,
        name: 'Alexander Wright',
        role: 'ADMIN',
        dossierCode: 'DOSSIER // 0842-AW',
        tier: 'HERITAGE PATRON',
        vipActive: true,
        atelierHub: 'COLOMBO FLAGSHIP',
        phone: '+94 77 112 3456',
        liaisonName: 'LAKSHAN P.',
        liaisonNotes:
          'Prefers oversized silhouettes, Sri Lankan heritage artwork, and bespoke gift boxing.',
        totalSpendUsd: 135,
        storeCreditUsd: 0,
      },
    });

    const julian = await this.prisma.user.create({
      data: {
        email: 'julian.desilva@verssaro.vip',
        passwordHash,
        name: 'Julian De Silva',
        role: 'CLIENT',
        dossierCode: 'DOSSIER // 1104-JD',
        tier: 'HERITAGE PATRON',
        vipActive: true,
        atelierHub: 'COLOMBO / LONDON',
        phone: '+44 20 7946 0821',
        liaisonName: 'LAKSHAN P.',
        liaisonNotes: 'Prefers Guardian & Mayara tees with double hangtag and collector box.',
        totalSpendUsd: 90,
        storeCreditUsd: 0,
      },
    });

    await this.prisma.address.create({
      data: {
        userId: alexander.id,
        label: 'Colombo Flagship Suite',
        classification: 'RESIDENTIAL',
        isDefault: true,
        recipientName: 'Alexander Wright',
        company: 'VERSSARO Private Client',
        addressLine1: '89 Ward Place',
        addressLine2: 'Apt 14-B',
        city: 'Colombo',
        province: 'Western Province',
        postalCode: '00700',
        country: 'Sri Lanka',
        countryCode: 'LK',
        phone: '+94 77 112 3456',
        carrierPreference: 'Colombo White-Glove Same Day',
        deliveryInstructions: 'Deliver in rigid gift box with seal.',
      },
    });

    const createdProducts: Record<string, any> = {};
    for (const p of SEED_PRODUCTS) {
      const created = await this.prisma.product.create({
        data: {
          slug: p.slug,
          sku: p.sku,
          seriesCode: p.seriesCode,
          name: p.name,
          subtitle: p.subtitle,
          category: p.category,
          categoryLabel: p.categoryLabel,
          capsule: p.capsule,
          editionLabel: p.editionLabel,
          priceUsd: p.priceUsd,
          compareAtUsd: p.compareAtUsd,
          cogsUsd: p.cogsUsd,
          gsm: p.gsm,
          material: p.material,
          silhouette: p.silhouette,
          description: p.description,
          fitNotes: p.fitNotes,
          careNotes: p.careNotes,
          badge: p.badge,
          status: p.status,
          isFeatured: p.isFeatured,
          isBestseller: p.isBestseller,
          isNewDrop: p.isNewDrop,
          ratingAvg: p.ratingAvg,
          reviewCount: p.reviewCount,
          colorwaysJson: p.colorwaysJson,
          sizesJson: p.sizesJson,
          imagesJson: p.imagesJson,
          measurementsJson: p.measurementsJson,
        },
      });
      createdProducts[p.sku] = created;
    }

    // Reviews
    if (createdProducts['VS-01-GUARDIAN']) {
      await this.prisma.review.create({
        data: {
          productId: createdProducts['VS-01-GUARDIAN'].id,
          authorName: 'Ranil Wickramasinghe',
          authorLocation: 'Colombo / Verified Client',
          verifiedBuyer: true,
          rating: 5,
          fitFeedback: 'oversized',
          title: 'The fabric drape and back print are masterworks',
          body: 'Heavyweight organic cotton with unbelievable structure. The gold emblem and flame guardian print feel regal.',
          sizePurchased: 'L',
          colorPurchased: 'Obsidian Black',
        },
      });
    }

    if (createdProducts['VS-02-MAYARA']) {
      await this.prisma.review.create({
        data: {
          productId: createdProducts['VS-02-MAYARA'].id,
          authorName: 'Dilini Senanayake',
          authorLocation: 'Kandy / Verified Client',
          verifiedBuyer: true,
          rating: 5,
          fitFeedback: 'oversized',
          title: 'Mayara back print is vibrant and powerful',
          body: 'The teal and crimson feathers against matte black look stunning in daylight. Beautiful gift box packaging.',
          sizePurchased: 'M',
          colorPurchased: 'Obsidian Black',
        },
      });
    }

    // Promo codes
    await this.prisma.promoCode.createMany({
      data: [
        {
          code: 'ARCHIVE10',
          name: 'Atelier Heritage 10% Welcome',
          description: '10% private discount on any first acquisition',
          campaignType: 'HERITAGE_PROMO',
          discountType: 'PERCENT',
          discountValue: 10,
          minSubtotalUsd: 0,
          gateTarget: 'Heritage Registry',
          endsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        {
          code: 'HERITAGE20',
          name: 'Patron Circle Privilege',
          description: '20% privilege on orders over 100 USD',
          campaignType: 'HERITAGE_PROMO',
          discountType: 'PERCENT',
          discountValue: 20,
          minSubtotalUsd: 100,
          gateTarget: 'VIP Patrons',
          endsAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        },
      ],
    });

    // Sample Order
    if (createdProducts['VS-01-GUARDIAN'] && createdProducts['VS-02-MAYARA']) {
      await this.prisma.order.create({
        data: {
          orderNumber: 'VR-2025-98421-COL',
          userId: alexander.id,
          sessionId: 'demo-session-aw',
          customerName: 'Alexander Wright',
          email: 'alexander.wright@verssaro.vip',
          phone: '+94 77 112 3456',
          status: 'PROCESSING_QC',
          paymentMethod: 'card',
          paymentStatus: 'SETTLED',
          shippingMethod: 'colombo_same_day',
          carrierName: 'Colombo Atelier White-Glove Same-Day Courier',
          trackingNumber: 'ATELIER-CMB-8421',
          destinationCode: 'CMB-01',
          shippingAddressJson: JSON.stringify({
            recipientName: 'Alexander Wright',
            addressLine1: '89 Ward Place',
            city: 'Colombo',
            postalCode: '00700',
            country: 'Sri Lanka',
            phone: '+94 77 112 3456',
          }),
          packagingManifestJson: JSON.stringify({
            collectorBox: true,
            dustBag: 'Heavy Unbleached Cotton Preservation Folio',
            giftMessage: 'Heritage in motion.',
          }),
          subtotalUsd: 90,
          discountUsd: 9,
          shippingUsd: 0,
          dutyUsd: 0,
          totalUsd: 81,
          promoCodeUsed: 'ARCHIVE10',
          milestoneStep: 2,
          items: {
            create: [
              {
                productId: createdProducts['VS-01-GUARDIAN'].id,
                sku: 'VS-01-GUARDIAN',
                name: 'Guardian of the Flame',
                size: 'L',
                colorName: 'Obsidian Black',
                imageUrl: '/assets/img/p-guardian.webp',
                unitPrice: 45,
                quantity: 1,
                lineTotal: 45,
              },
              {
                productId: createdProducts['VS-02-MAYARA'].id,
                sku: 'VS-02-MAYARA',
                name: 'Mayara',
                size: 'M',
                colorName: 'Obsidian Black',
                imageUrl: '/assets/img/p-mayara.webp',
                unitPrice: 45,
                quantity: 1,
                lineTotal: 45,
              },
            ],
          },
        },
      });
    }

    // Sample Enquiry
    if (createdProducts['VS-03-IVORY']) {
      await this.prisma.enquiry.create({
        data: {
          enquiryCode: 'ENQ-2026-4819',
          userId: julian.id,
          customerName: 'Julian De Silva',
          email: 'julian.desilva@verssaro.vip',
          phone: '+44 20 7946 0821',
          notes: 'Enquiring about availability of The Ivory Edit in size XL with gift packaging.',
          source: 'WEBSITE_DRAWER',
          status: 'NEW',
          items: {
            create: [
              {
                productId: createdProducts['VS-03-IVORY'].id,
                name: 'The Ivory Edit',
                size: 'XL',
                colorName: 'Warm Ivory',
                quantity: 1,
              },
            ],
          },
        },
      });
    }

    this.logger.log('VERSSARO luxury heritage database seed complete.');
  }
}
