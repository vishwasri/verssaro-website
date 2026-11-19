import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products/products.service';
import { EnquiriesService } from './enquiries/enquiries.service';
import { PrismaService } from './prisma/prisma.service';
import { serializeProduct } from './common/product-mapper';
import { SEED_PRODUCTS } from './prisma/seed.data';

describe('VERSSARO Backend Domain Suite', () => {
  let productsService: ProductsService;
  let enquiriesService: EnquiriesService;
  let mockPrisma: any;

  const sampleProducts = SEED_PRODUCTS.map((p, idx) => ({
    id: `prod-0${idx + 1}`,
    ...p,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  }));

  const inMemoryEnquiries: any[] = [];

  beforeEach(async () => {
    mockPrisma = {
      product: {
        findMany: jest.fn().mockResolvedValue(sampleProducts),
        findFirst: jest.fn().mockImplementation(({ where }) => {
          const target = where.OR?.[0]?.slug || where.OR?.[1]?.id || where.slug || where.id;
          const found = sampleProducts.find((p) => p.slug === target || p.id === target);
          return Promise.resolve(found ? { ...found, reviews: [] } : null);
        }),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.slug) {
            const found = sampleProducts.find((p) => p.slug === where.slug);
            return Promise.resolve(found || null);
          }
          if (where.id) {
            const found = sampleProducts.find((p) => p.id === where.id);
            return Promise.resolve(found || null);
          }
          return Promise.resolve(null);
        }),
      },
      enquiry: {
        create: jest.fn().mockImplementation(({ data }) => {
          const newEnq = {
            id: `enq-${Date.now()}`,
            enquiryCode: data.enquiryCode,
            customerName: data.customerName,
            email: data.email,
            phone: data.phone,
            notes: data.notes,
            status: 'NEW',
            source: data.source,
            createdAt: new Date(),
            updatedAt: new Date(),
            items: data.items.create.map((it: any, idx: number) => ({
              id: `item-${idx}`,
              ...it,
            })),
          };
          inMemoryEnquiries.push(newEnq);
          return Promise.resolve(newEnq);
        }),
        findMany: jest.fn().mockImplementation(() => Promise.resolve(inMemoryEnquiries)),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          const found = inMemoryEnquiries.find((e) => e.id === where.id);
          return Promise.resolve(found || null);
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const found = inMemoryEnquiries.find((e) => e.id === where.id);
          if (found) {
            Object.assign(found, data);
            return Promise.resolve(found);
          }
          return Promise.resolve(null);
        }),
      },
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        EnquiriesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    productsService = module.get<ProductsService>(ProductsService);
    enquiriesService = module.get<EnquiriesService>(EnquiriesService);
  });

  describe('Products & Heritage Catalog', () => {
    it('returns authentic VERSSARO heritage products with correct serialization', async () => {
      const result = await productsService.findAll();
      expect(result.items.length).toBe(4);
      expect(result.total).toBe(4);

      const slugs = result.items.map((p) => p.slug);
      expect(slugs).toContain('guardian-of-the-flame');
      expect(slugs).toContain('mayara');
      expect(slugs).toContain('the-ivory-edit');
      expect(slugs).toContain('highlands-edition');
    });

    it('finds single product by slug and formats specifications correctly', async () => {
      const guardian = await productsService.findBySlug('guardian-of-the-flame');
      expect(guardian.product).toBeDefined();
      expect(guardian.product.name).toBe('Guardian of the Flame');
      expect(guardian.product.sku).toBe('VS-01-GUARDIAN');
      expect(guardian.product.priceUsd).toBe(45);
      expect(guardian.product.sizes.map((s) => s.size)).toEqual(['S', 'M', 'L', 'XL', 'XXL']);
      expect(guardian.product.images[0]).toBe('/assets/img/p-guardian.webp');
    });

    it('serializes product and ensures obsolete fields (nfc, crypto) are excluded', () => {
      const raw = sampleProducts[0] as any;
      const serialized = serializeProduct(raw);

      expect((serialized as any).nfcEnabled).toBeUndefined();
      expect((serialized as any).siliconLocation).toBeUndefined();
      expect((serialized as any).smartPerk).toBeUndefined();
      expect(serialized.name).toBe('Guardian of the Flame');
      expect(serialized.priceUsd).toBe(45);
      expect(serialized.totalStock).toBeGreaterThan(0);
    });
  });

  describe('Enquiries & Client Care Pipeline', () => {
    it('creates and records client drawer enquiries with item details', async () => {
      const created = await enquiriesService.createEnquiry({
        customerName: 'Alexander Wright',
        email: 'alexander@verssaro.vip',
        phone: '+94771234567',
        notes: 'Enquiring for private courier to Ward Place',
        source: 'WEBSITE_DRAWER',
        items: [
          {
            productId: 'prod-01',
            name: 'Guardian of the Flame',
            size: 'L',
            colorName: 'Obsidian Black',
            quantity: 1,
          },
          {
            productId: 'prod-03',
            name: 'The Ivory Edit',
            size: 'XL',
            colorName: 'Warm Ivory',
            quantity: 1,
          },
        ],
      });

      expect(created.enquiryCode).toMatch(/^ENQ-\d{4}-\d{4}$/);
      expect(created.customerName).toBe('Alexander Wright');
      expect(created.items.length).toBe(2);
      expect(created.items[0].name).toBe('Guardian of the Flame');
      expect(created.items[0].size).toBe('L');
    });

    it('fetches all enquiries ordered by date', async () => {
      const all = await enquiriesService.findAll();
      expect(all.length).toBeGreaterThanOrEqual(1);
      expect(all[0].customerName).toBe('Alexander Wright');
    });

    it('updates enquiry status along the concierge pipeline', async () => {
      const all = await enquiriesService.findAll();
      const first = all[0];

      const updated = await enquiriesService.updateStatus(first.id, {
        status: 'DISPATCHED',
      });
      expect(updated.status).toBe('DISPATCHED');
    });
  });
});
