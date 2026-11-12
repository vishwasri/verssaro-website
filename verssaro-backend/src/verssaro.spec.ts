import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { ProductsService } from './products/products.service';
import { CartService } from './cart/cart.service';
import { OrdersService } from './orders/orders.service';
import { NfcService } from './nfc/nfc.service';
import { AdminService } from './admin/admin.service';

describe('VERSSARO Backend Domain Suite', () => {
  let moduleRef: TestingModule;
  let productsService: ProductsService;
  let cartService: CartService;
  let ordersService: OrdersService;
  let nfcService: NfcService;
  let adminService: AdminService;

  const testSessionId = `jest-session-${Date.now()}`;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    productsService = moduleRef.get(ProductsService);
    cartService = moduleRef.get(CartService);
    ordersService = moduleRef.get(OrdersService);
    nfcService = moduleRef.get(NfcService);
    adminService = moduleRef.get(AdminService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('filters catalog products by category and price', async () => {
    const all = await productsService.findAll();
    expect(all.items.length).toBeGreaterThanOrEqual(10);

    const hoodies = await productsService.findAll({ category: 'hoodies' });
    expect(hoodies.items.length).toBeGreaterThanOrEqual(2);
    expect(hoodies.items.every((p) => p.category === 'hoodies')).toBe(true);

    const under150 = await productsService.findAll({ maxPrice: '150' });
    expect(under150.items.every((p) => p.priceUsd <= 150)).toBe(true);
  });

  it('adds items to bag, applies ARCHIVE10 promo, and enforces free shipping threshold', async () => {
    const tee = await productsService.findBySlug(
      'archive-01-heavyweight-oversized-tee',
    );
    const hoodie = await productsService.findBySlug(
      'heavy-fleece-capsule-hoodie',
    );

    await cartService.addItem(testSessionId, {
      productId: tee.product.id,
      size: 'L',
      colorName: 'Obsidian Black',
      quantity: 1,
    });
    await cartService.addItem(testSessionId, {
      productId: hoodie.product.id,
      size: 'M',
      colorName: 'Vintage Wash',
      quantity: 1,
    });

    const discounted = await cartService.applyPromo(testSessionId, {
      code: 'ARCHIVE10',
    });

    expect(discounted.subtotalUsd).toBe(345);
    expect(discounted.discountUsd).toBe(34.5);
    expect(discounted.freeShipQualified).toBe(false);
    expect(discounted.amountToFreeShippingUsd).toBe(55);
    expect(discounted.totalUsd).toBe(335.5);
  });

  it('creates an order from cart, allocates NFC tag, and clears bag', async () => {
    const order = await ordersService.createOrder(testSessionId, undefined, {
      customerName: 'Alexander Wright',
      email: 'alexander.wright@verssaro.vip',
      phone: '+94771123456',
      addressLine1: '89 Ward Place',
      city: 'Colombo',
      postalCode: '00300',
      country: 'Sri Lanka',
      countryCode: 'LK',
      shippingMethod: 'colombo_same_day',
      paymentMethod: 'card',
    });

    expect(order.orderNumber).toMatch(/^VR-2025-/);
    expect(order.totalUsd).toBe(310.5);

    const postOrderBag = await cartService.getCart(testSessionId);
    expect(postOrderBag.items.length).toBe(0);
  });

  it('executes NFC P2P provenance transfer and logs 5% royalty receipt', async () => {
    const vault = await nfcService.getVault();
    expect(vault.artifacts.length).toBeGreaterThanOrEqual(1);
    const first = vault.artifacts[0];

    const res = await nfcService.transferProvenance({
      artifactId: first.id,
      recipientInput: '0x3B89e1F4D99100B32E496DAE',
      transferMethod: 'HEX',
    });

    expect(res.receipt.receiptCode).toMatch(/^REC-2025-/);
    expect(res.receipt.royaltyUsd).toBe(
      Number((first.valuationUsd * 0.05).toFixed(2)),
    );

    // Restore ownership back to Alexander Wright for demo consistency
    await nfcService.bindToVault(first.id);
  });

  it('returns Atelier Admin dashboard telemetry & inventory matrix', async () => {
    const dashboard = await adminService.getDashboardTelemetry();
    expect(dashboard.kpis.grossRevenueUsd).toBeGreaterThan(480000);

    const matrix = await adminService.getInventoryMatrix();
    expect(matrix.rows.length).toBeGreaterThanOrEqual(10);
  });
});

