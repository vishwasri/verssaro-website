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

    this.logger.log('Seeding VERSSARO database...');

    await this.prisma.systemConfig.upsert({
      where: { id: 'singleton' },
      update: {},
      create: {
        id: 'singleton',
        botLockdownActive: false,
        maintenanceMode: false,
      },
    });

    const passwordHash = await bcrypt.hash('verssaro2025', 10);

    const alexander = await this.prisma.user.create({
      data: {
        email: 'alexander.wright@verssaro.vip',
        passwordHash,
        name: 'Alexander Wright',
        role: 'ADMIN',
        dossierCode: 'DOSSIER // 0842-AW',
        tier: 'TIER 01 // PRIVATE CIRCLE',
        vipActive: true,
        walletAddress: '0x7F91...2C4e',
        walletFull: '0x7F91a8C3E40B18F004192C4e',
        atelierHub: 'COLOMBO 07 / LONDON',
        phone: '+94 77 112 3456',
        liaisonName: 'LAKSHAN P.',
        liaisonNotes:
          'Prefers architectural silhouettes, matte obsidian washes, and Colombo White-Glove dispatch.',
        totalSpendUsd: 14280,
        restorationPassesRemaining: 4,
        restorationPassesTotal: 4,
        storeCreditUsd: 480,
        kycStatus: 'KYC-ROOT VERIFIED',
        recentLedgerNote:
          'Handed over Structural Bomber Jacket to Julian De Silva via P2P Transfer',
      },
    });

    const julian = await this.prisma.user.create({
      data: {
        email: 'julian.desilva@verssaro.vip',
        passwordHash,
        name: 'Julian De Silva',
        role: 'CLIENT',
        dossierCode: 'DOSSIER // 1104-JD',
        tier: 'TIER 02 // SOVEREIGN VERIFIED',
        vipActive: true,
        walletAddress: '0x3B89...96DAE',
        walletFull: '0x3B89e1F4D99100B32E496DAE',
        atelierHub: 'LONDON NODE // RESIDENT',
        phone: '+44 20 7946 0821',
        liaisonName: 'SARA K.',
        liaisonNotes: 'London Mayfair courier only; prefers garment preservation bags.',
        totalSpendUsd: 8450,
        restorationPassesRemaining: 2,
        restorationPassesTotal: 2,
        storeCreditUsd: 150,
        kycStatus: 'KYC-ROOT VERIFIED',
        recentLedgerNote: 'Verified Archive 01 Heavy Box Tee at London Mayfair Suite',
      },
    });

    await this.prisma.user.createMany({
      data: [
        {
          email: 'elena.rostova@verssaro.vip',
          passwordHash,
          name: 'Elena Rostova',
          role: 'CLIENT',
          dossierCode: 'DOSSIER // 0519-ER',
          tier: 'TIER 01 // PRIVATE CIRCLE',
          vipActive: true,
          walletAddress: '0x94D2...71FB',
          walletFull: '0x94D2a1004B3E88F9100771FB',
          atelierHub: 'PARIS / GENEVA',
          phone: '+41 22 819 0400',
          liaisonName: 'LAKSHAN P.',
          totalSpendUsd: 19400,
          restorationPassesRemaining: 3,
          restorationPassesTotal: 4,
          storeCreditUsd: 620,
          kycStatus: 'KYC-ROOT VERIFIED',
          recentLedgerNote: 'Early access claim on Archive 02 High-Neck Shell',
        },
        {
          email: 'marcus.vance@verssaro.vip',
          passwordHash,
          name: 'Marcus Vance',
          role: 'CLIENT',
          dossierCode: 'DOSSIER // 1408-MV',
          tier: 'TIER 02 // SOVEREIGN VERIFIED',
          vipActive: true,
          walletAddress: '0x12C8...4E02',
          walletFull: '0x12C899A210B77F1189004E02',
          atelierHub: 'DUBAI PRIVATE VAULT',
          phone: '+971 50 482 1190',
          liaisonName: 'TARA M.',
          totalSpendUsd: 6120,
          restorationPassesRemaining: 2,
          restorationPassesTotal: 2,
          storeCreditUsd: 0,
          kycStatus: 'KYC PENDING',
          recentLedgerNote: 'Pending Dubai DIFC physical address attestation',
        },
      ],
    });

    await this.prisma.address.createMany({
      data: [
        {
          userId: alexander.id,
          label: 'COLOMBO 03 // PRIMARY RESIDENCE',
          classification: 'RESIDENTIAL',
          isDefault: true,
          recipientName: 'Alexander Wright',
          company: 'Monolith Holdings',
          addressLine1: 'Penthouse Residencies 89, Ward Place',
          addressLine2: 'Suite 14B, Cinnamon Gardens',
          city: 'Colombo',
          province: 'Western Province',
          postalCode: '00300',
          country: 'Sri Lanka',
          countryCode: 'LK',
          phone: '+94 77 112 3456',
          carrierPreference: 'COLOMBO ATELIER SAME-DAY COURIER',
          deliveryInstructions: 'Private lift access code 8842. Leave strictly with concierge desk.',
          packagingSpec: 'ARCHIVAL_MONOLITH_BOX',
          coordinates: '6.9147° N, 79.8659° E',
        },
        {
          userId: alexander.id,
          label: 'MAYFAIR LONDON // PIED-À-TERRE',
          classification: 'RESIDENTIAL',
          isDefault: false,
          recipientName: 'Alexander Wright',
          company: null,
          addressLine1: '18 Mount Street, Mayfair',
          addressLine2: 'Residence 4A',
          city: 'London',
          province: 'Greater London',
          postalCode: 'W1K 2RN',
          country: 'United Kingdom',
          countryCode: 'GB',
          phone: '+44 20 7946 0192',
          carrierPreference: 'DHL EXPRESS PRIORITY DDP',
          deliveryInstructions: 'Porter signature required upon air charter arrival.',
          packagingSpec: 'UNBLEACHED_DUST_FOLIO',
          coordinates: '51.5096° N, 0.1518° W',
        },
        {
          userId: alexander.id,
          label: 'COLOMBO FLAGSHIP // BOUTIQUE LOCKER',
          classification: 'PRIVATE_VAULT',
          isDefault: false,
          recipientName: 'Alexander Wright // Locker #09',
          company: 'VERSSARO Atelier Colombo',
          addressLine1: '42 Alfred House Gardens',
          addressLine2: 'Private Fitting Suite #03',
          city: 'Colombo',
          province: 'Western Province',
          postalCode: '00300',
          country: 'Sri Lanka',
          countryCode: 'LK',
          phone: '+94 11 258 9000',
          carrierPreference: 'IN-ATELIER CUSTODY HOLD',
          deliveryInstructions: 'Stage for Friday 18:00 bespoke fitting consultation.',
          packagingSpec: 'ATELIER_HANGER_GARMENT_BAG',
          coordinates: '6.8984° N, 79.8569° E',
        },
        {
          userId: alexander.id,
          label: 'DUBAI DIFC // PRIVATE VAULT',
          classification: 'OFFICE',
          isDefault: false,
          recipientName: 'Alexander Wright',
          company: 'DIFC Gate Village Vault 04',
          addressLine1: 'Gate Village Building 08, Level 4',
          addressLine2: 'Suites 401-404',
          city: 'Dubai',
          province: 'Dubai',
          postalCode: '506701',
          country: 'United Arab Emirates',
          countryCode: 'AE',
          phone: '+971 4 362 2222',
          carrierPreference: 'DHL EXPRESS PRIORITY DDP',
          deliveryInstructions: 'Security badge required at Gate Village reception.',
          packagingSpec: 'ARCHIVAL_MONOLITH_BOX',
          coordinates: '25.2121° N, 55.2810° E',
        },
      ],
    });

    const createdProducts: Record<string, any> = {};
    for (const prod of SEED_PRODUCTS) {
      const created = await this.prisma.product.create({ data: prod });
      createdProducts[prod.sku] = created;
    }

    const teeProduct = createdProducts['VR-01-TEE-BLK'];
    if (teeProduct) {
      await this.prisma.review.createMany({
        data: [
          {
            productId: teeProduct.id,
            authorName: 'Julian V.',
            authorLocation: 'London // Tier 01 Collector',
            verifiedBuyer: true,
            rating: 5,
            fitFeedback: 'oversized',
            title: 'Unrivaled 320 GSM collar rigidity and drape',
            body: 'The high-ribbed collar stands up like outerwear even after multiple cold washes. The cropped shoulder drop sits with zero bunching over pleated cargos.',
            sizePurchased: 'L',
            colorPurchased: 'Obsidian Black',
            helpfulCount: 19,
          },
          {
            productId: teeProduct.id,
            authorName: 'Marcus D.',
            authorLocation: 'Colombo // Verified Client',
            verifiedBuyer: true,
            rating: 5,
            fitFeedback: 'true_to_size',
            title: 'True architectural jersey — NFC handshake instant',
            body: 'Picked up at the Colombo Atelier during Drop 01. Scanned the passive hem chip on first wear and registered directly to my archive dossier.',
            sizePurchased: 'M',
            colorPurchased: 'Obsidian Black',
            helpfulCount: 14,
          },
          {
            productId: teeProduct.id,
            authorName: 'Sora K.',
            authorLocation: 'Tokyo // Verified Client',
            verifiedBuyer: true,
            rating: 5,
            fitFeedback: 'true_to_size',
            title: 'Enzyme wash tone in Desert Clay looks obsidian indoors',
            body: 'Weight is dense without feeling oppressive. Packaging inside the collector monolith box elevated the entire unboxing ritual.',
            sizePurchased: 'S',
            colorPurchased: 'Desert Clay',
            helpfulCount: 9,
          },
        ],
      });
    }

    const promos = [
      {
        code: 'ARCHIVE10',
        name: 'ARCHIVE10 // VIP ALLOCATION',
        description: 'Standard 10% Sovereign Archive courtesy deduction across live capsules.',
        campaignType: 'STANDARD',
        discountType: 'PERCENT',
        discountValue: 10,
        minSubtotalUsd: 0,
        gateTarget: 'All Registered Clients',
        marginCapPercent: 10,
        claimsUsed: 184,
        claimsLimit: 500,
        attributedRevUsd: 42600,
        status: 'LIVE',
        endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      {
        code: 'SOVEREIGN-DROP-02',
        name: 'ARCHIVE 02: CYBERNETIC DRAPE EARLY ACCESS',
        description: 'Token-gated 15% privilege for Tier 01 Sovereign wallet holders.',
        campaignType: 'VIP_WHITELIST',
        discountType: 'PERCENT',
        discountValue: 15,
        minSubtotalUsd: 200,
        gateTarget: 'Tier 01 Sovereign ID // Bound NFC Garment',
        marginCapPercent: 15,
        claimsUsed: 84,
        claimsLimit: 100,
        attributedRevUsd: 121800,
        status: 'LIVE',
        endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        code: 'ATELIER-TIER1-PRIVATE',
        name: 'TIER 01 PRIVATE SALON CREDIT',
        description: '$150 fixed deduction on tailored outerwear or multi-piece baskets above $800.',
        campaignType: 'CONCIERGE',
        discountType: 'FIXED',
        discountValue: 150,
        minSubtotalUsd: 800,
        gateTarget: 'VIP Private Circle Dossiers',
        marginCapPercent: 18,
        claimsUsed: 32,
        claimsLimit: 50,
        attributedRevUsd: 52400,
        status: 'LIVE',
        endsAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      },
      {
        code: 'BASKET-THRESHOLD-3K',
        name: 'MULTI-VAULT ACQUISITION THRESHOLD',
        description: 'Automated 18% VIP clearance on bespoke baskets exceeding $3,000 USD.',
        campaignType: 'TIERED_BASKET',
        discountType: 'PERCENT',
        discountValue: 18,
        minSubtotalUsd: 3000,
        gateTarget: 'Auto-Triggered at $3,000 Bag Subtotal',
        marginCapPercent: 18,
        claimsUsed: 12,
        claimsLimit: 40,
        attributedRevUsd: 48900,
        status: 'LIVE',
        endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ];
    await this.prisma.promoCode.createMany({ data: promos });

    const demoSession = 'demo-session-aw';
    await this.prisma.cartSession.create({
      data: {
        sessionId: demoSession,
        promoCode: 'ARCHIVE10',
        collectorBox: true,
        giftMessage: 'Curated for Colombo Private Viewing // Archive 01',
        reservedUntil: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    await this.prisma.cartItem.createMany({
      data: [
        {
          sessionId: demoSession,
          productId: createdProducts['VR-01-TEE-BLK'].id,
          size: 'L',
          colorName: 'Obsidian Black',
          colorHex: '#141414',
          quantity: 1,
        },
        {
          sessionId: demoSession,
          productId: createdProducts['VSR-HOD-082'].id,
          size: 'M',
          colorName: 'Vintage Wash',
          colorHex: '#282829',
          quantity: 1,
        },
        {
          sessionId: demoSession,
          productId: createdProducts['VR-ACC-SCK-02'].id,
          size: 'OS',
          colorName: 'Jet Black / Chalk White',
          colorHex: '#141414',
          quantity: 1,
        },
      ],
    });

    const wishlistConfigs = [
      { sku: 'VSR-HOD-082', size: 'L', color: 'Vintage Wash', stockState: 'IN_STOCK' },
      { sku: 'VR-01-TEE-BLK', size: 'L', color: 'Obsidian Black', stockState: 'LOW_STOCK' },
      { sku: 'VSR-CRG-044', size: 'M', color: 'Titanium Onyx', stockState: 'IN_STOCK' },
      { sku: 'VSR-JKT-109', size: 'L', color: 'Matte Black', stockState: 'LOW_STOCK' },
      { sku: 'VSR-JWL-018', size: 'M', color: 'Oxidized Silver', stockState: 'IN_STOCK' },
      { sku: 'VSR-ACC-033', size: 'OS', color: 'Matte Black', stockState: 'IN_STOCK' },
      { sku: 'VSR-W-012', size: 'S', color: 'Obsidian Black', stockState: 'IN_STOCK' },
      { sku: 'VSR-OUT-077', size: 'L', color: 'Matte Obsidian', stockState: 'PRE_ORDER' },
    ];
    for (const w of wishlistConfigs) {
      const p = createdProducts[w.sku];
      if (p) {
        await this.prisma.wishlistItem.create({
          data: {
            sessionId: demoSession,
            userId: alexander.id,
            productId: p.id,
            selectedSize: w.size,
            selectedColor: w.color,
            stockState: w.stockState,
          },
        });
      }
    }

    const order1 = await this.prisma.order.create({
      data: {
        orderNumber: 'VR-2025-98421-COL',
        userId: alexander.id,
        sessionId: demoSession,
        customerName: 'Alexander Wright',
        email: 'alexander.wright@verssaro.vip',
        phone: '+94 77 112 3456',
        status: 'DISPATCHED',
        paymentMethod: 'card',
        paymentStatus: 'SETTLED',
        shippingMethod: 'colombo_same_day',
        carrierName: 'DHL Express Priority / Colombo Atelier Dispatch',
        trackingNumber: 'DHL-EXPRESS-9402-8819-LK',
        destinationCode: 'CMB-03',
        shippingAddressJson: JSON.stringify({
          recipientName: 'Alexander Wright',
          addressLine1: 'Penthouse Residencies 89, Ward Place',
          addressLine2: 'Suite 14B, Cinnamon Gardens',
          city: 'Colombo',
          postalCode: '00300',
          country: 'Sri Lanka',
          phone: '+94 77 112 3456',
        }),
        packagingManifestJson: JSON.stringify({
          collectorBox: true,
          dustBag: 'Heavy Unbleached Cotton Preservation Folio',
          giftMessage: 'Curated for Colombo Private Viewing // Archive 01',
        }),
        subtotalUsd: 380,
        discountUsd: 38,
        shippingUsd: 0,
        dutyUsd: 0,
        totalUsd: 342,
        promoCodeUsed: 'ARCHIVE10',
        milestoneStep: 3,
        items: {
          create: [
            {
              productId: createdProducts['VR-01-TEE-BLK'].id,
              sku: 'VR-01-TEE-BLK',
              name: 'Archive 01 Oversized Tee',
              size: 'L',
              colorName: 'Obsidian Black',
              imageUrl: JSON.parse(createdProducts['VR-01-TEE-BLK'].imagesJson)[0],
              unitPrice: 125,
              quantity: 1,
              lineTotal: 125,
            },
            {
              productId: createdProducts['VSR-HOD-082'].id,
              sku: 'VSR-HOD-082',
              name: 'Heavy Fleece Capsule Hoodie',
              size: 'M',
              colorName: 'Vintage Wash',
              imageUrl: JSON.parse(createdProducts['VSR-HOD-082'].imagesJson)[0],
              unitPrice: 220,
              quantity: 1,
              lineTotal: 220,
            },
            {
              productId: createdProducts['VR-ACC-SCK-02'].id,
              sku: 'VR-ACC-SCK-02',
              name: 'Heavyweight Monogram Sock Duo',
              size: 'OS',
              colorName: 'Jet Black / Chalk White',
              imageUrl: JSON.parse(createdProducts['VR-ACC-SCK-02'].imagesJson)[0],
              unitPrice: 35,
              quantity: 1,
              lineTotal: 35,
            },
          ],
        },
      },
    });

    await this.prisma.order.create({
      data: {
        orderNumber: 'VR-2025-98104-LHR',
        userId: alexander.id,
        sessionId: demoSession,
        customerName: 'Alexander Wright',
        email: 'alexander.wright@verssaro.vip',
        phone: '+44 20 7946 0192',
        status: 'DELIVERED',
        paymentMethod: 'card',
        paymentStatus: 'SETTLED',
        shippingMethod: 'dhl_express',
        carrierName: 'DHL Air Charter Express DDP',
        trackingNumber: 'DHL-UK-7721-9043-GB',
        destinationCode: 'LHR-W1K',
        shippingAddressJson: JSON.stringify({
          recipientName: 'Alexander Wright',
          addressLine1: '18 Mount Street, Mayfair',
          city: 'London',
          postalCode: 'W1K 2RN',
          country: 'United Kingdom',
        }),
        packagingManifestJson: JSON.stringify({ collectorBox: true }),
        subtotalUsd: 1450,
        discountUsd: 0,
        shippingUsd: 0,
        dutyUsd: 0,
        totalUsd: 1450,
        milestoneStep: 4,
        items: {
          create: [
            {
              productId: createdProducts['SKU-VR-BMB-014'].id,
              sku: 'SKU-VR-BMB-014',
              name: 'Structural Modular Trench Coat',
              size: 'L',
              colorName: 'Obsidian Black',
              imageUrl: JSON.parse(createdProducts['SKU-VR-BMB-014'].imagesJson)[0],
              unitPrice: 1450,
              quantity: 1,
              lineTotal: 1450,
            },
          ],
        },
      },
    });

    await this.prisma.order.create({
      data: {
        orderNumber: 'VR-2025-98509-DXB',
        userId: julian.id,
        sessionId: 'session-julian-uk',
        customerName: 'Julian De Silva',
        email: 'julian.desilva@verssaro.vip',
        phone: '+44 20 7946 0821',
        status: 'UNFULFILLED',
        paymentMethod: 'card',
        paymentStatus: 'SETTLED',
        shippingMethod: 'dhl_express',
        carrierName: 'DHL Express Priority DDP',
        trackingNumber: 'PENDING-MANIFEST-01',
        destinationCode: 'LHR-01',
        shippingAddressJson: JSON.stringify({
          recipientName: 'Julian De Silva',
          addressLine1: '24 Grosvenor Square',
          city: 'London',
          postalCode: 'W1K 6LE',
          country: 'United Kingdom',
        }),
        packagingManifestJson: JSON.stringify({ collectorBox: true }),
        subtotalUsd: 555,
        discountUsd: 0,
        shippingUsd: 0,
        dutyUsd: 0,
        totalUsd: 555,
        milestoneStep: 1,
        items: {
          create: [
            {
              productId: createdProducts['VSR-JKT-109'].id,
              sku: 'VSR-JKT-109',
              name: 'Structural Bomber Jacket',
              size: 'M',
              colorName: 'Matte Black',
              imageUrl: JSON.parse(createdProducts['VSR-JKT-109'].imagesJson)[0],
              unitPrice: 360,
              quantity: 1,
              lineTotal: 360,
            },
            {
              productId: createdProducts['VSR-CRG-044'].id,
              sku: 'VSR-CRG-044',
              name: 'Tactical Pleated Cargo Pant',
              size: 'M',
              colorName: 'Titanium Onyx',
              imageUrl: JSON.parse(createdProducts['VSR-CRG-044'].imagesJson)[0],
              unitPrice: 195,
              quantity: 1,
              lineTotal: 195,
            },
          ],
        },
      },
    });

    const nfcBomber = await this.prisma.nfcArtifact.create({
      data: {
        uid: '04:22:7A:D1:19:4A:80',
        tagLabel: 'NFC-9941-8814',
        keccakHash: '0x71c90f42d81e532b90c8f10a7714a234b981cc42',
        tokenId: '#0812-SOV',
        productId: createdProducts['VSR-JKT-109'].id,
        orderId: order1.id,
        ownerUserId: alexander.id,
        garmentTitle: 'Structural Bomber Jacket',
        sku: 'VSR-JKT-109',
        colorway: 'Matte Obsidian Black',
        size: 'L',
        acquiredLabel: 'DEC 2024',
        valuationUsd: 980,
        editionRun: 'RUN 01/40 // ED. #012',
        textileSpec: '410 GSM Hydrophobic Bonded Nylon',
        siliconLocation: 'Internal Storm Pocket Shield',
        smartPerk: 'Priority Resole & Waterproof Membrane Service',
        warehouseNode: 'Client Custody',
        status: 'ACTIVE_BOUND',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBEJxDF7u9mctghXRG8DjuWQcVQPovCBZdl__K2_fjGb0DypJCbtFL6QJwUCJ0qbqXtj34QG5-evvrL8by-c57zfR83qLYMPt4BEGyOlQqsfqg1ks10bhG__Zc1J9nq5J1w4a51mbv0qx4NP_gjTToguuyde_9kCqF_n_u7Hda-hQbISHO4ZeOYrxFUDY0Q0zzBDuG7sjF7swQPCiUssAeAo5TnuTsNeW8MSgH4FxA',
      },
    });

    const nfcTee = await this.prisma.nfcArtifact.create({
      data: {
        uid: '04:8F:A2:91:BC:60:80',
        tagLabel: 'NFC-9941-8812',
        keccakHash: '0x3d0019b7a2c88101c4a928f1a8b99100e42c881c',
        tokenId: '#018-ARC01',
        productId: createdProducts['VR-01-TEE-BLK'].id,
        orderId: order1.id,
        ownerUserId: alexander.id,
        garmentTitle: 'Archive 01 Heavyweight Oversized Tee',
        sku: 'VR-01-TEE-BLK',
        colorway: 'Onyx Black',
        size: 'L',
        acquiredLabel: 'JAN 2025',
        valuationUsd: 240,
        editionRun: 'RUN 01/150 // ED. #018',
        textileSpec: '320 GSM Combed Organic Cotton',
        siliconLocation: 'Passive HF NFC Hem Seam',
        smartPerk: 'Lifetime Complimentary Cold-Wash Restorations',
        warehouseNode: 'Client Custody',
        status: 'ACTIVE_BOUND',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDLXBCmDXdbX9BVltV7t1AZqmo0UaxUHm1DkVBzNLuE_TJjPE8jmiFOe5S6RKavieYzboXcIDyfNCVcNjee3PNM4uGKTG3DN9P-rb22LM0xjqvV5Q-iDZzwZMsnbQ1BpIHZ3V-bn0rIHBEyjj654qVvRZbSO4IypstjL9Z8n1_xjH82DtDBg8fWKfO9zsubFq4hog8ItL-VYWv6niBbYO8oSGSMKQrT2UZdtbNi87w',
      },
    });

    await this.prisma.nfcArtifact.createMany({
      data: [
        {
          uid: '04:99:C1:22:8F:10:04',
          tagLabel: 'NFC-9941-8813',
          keccakHash: '0x981ee4f00b8921c440a21bb821f0209a3c4daa20',
          tokenId: '#007-FL02',
          productId: createdProducts['VSR-HOD-082'].id,
          orderId: order1.id,
          ownerUserId: alexander.id,
          garmentTitle: 'Heavy Fleece Capsule Hoodie',
          sku: 'VSR-HOD-082',
          colorway: 'Vintage Wash',
          size: 'M',
          acquiredLabel: 'DEC 2024',
          valuationUsd: 420,
          editionRun: 'RUN 02/50 // ED. #007',
          textileSpec: '520 GSM Loopback French Terry',
          siliconLocation: 'Left Cuff Internal Woven Seam',
          smartPerk: '24H Early Drop Pass + Colombo VIP Atelier',
          warehouseNode: 'Client Custody',
          status: 'ACTIVE_BOUND',
          imageUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuCpTXbUXNa8KPzPs0MhvMNZeVjOv6zEtVNuoCCtJ2HpxUT7YzdtOXQIszFgeghWM3LOXCMjjIf5Kg76k6GdVjbeiUst8-iifyn4Ur400fl5Vhi1SjlNLDrPnhjoWbhCkY0pOIXd9vUPQzOTLynZSLeGqIAeEH_WMvMCLBk2lpAN-U-TVZOBBIORH1-F-hzAcuCAxedPXN2y-EmnBLIto8ZzBt7KurZskXPUBCl3KK0',
        },
        {
          uid: '04:51:E8:09:AA:7C:19',
          tagLabel: 'NFC-9941-8815',
          keccakHash: '0x49c1a88e9b2f7719c2a183b41f99a3102d11b902',
          tokenId: '#014-CRG01',
          productId: createdProducts['VSR-CRG-044'].id,
          ownerUserId: alexander.id,
          garmentTitle: 'Tactical Pleated Cargo Pant',
          sku: 'VSR-CRG-044',
          colorway: 'Titanium Onyx',
          size: 'M',
          acquiredLabel: 'JAN 2025',
          valuationUsd: 380,
          editionRun: 'RUN 01/120 // ED. #014',
          textileSpec: '380 GSM Technical Ripstop',
          siliconLocation: 'Right Waistband Internal Flap',
          smartPerk: 'Atelier Hardware Lifetime Replacement',
          warehouseNode: 'Colombo Flagship',
          status: 'ACTIVE_BOUND',
          imageUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuDnknU1X4GDf2v2lRCgXEh90Zr6zGqUNpj-Vhn_30axt2l361Y1Rrs8oIsrA4_0RaYSy1F7cShKKEilnM2rid7DBzB4yxpyMmVG9u76GHph4NTvobbXJKBrcQ6M8B4XLzAD_WS6H6YN0yflLWPkd82OFztj-4arI_tehAgOMdT4xlLh6q4sE_bAHnnqOgypTTthyBQBKQW6NuvhCWayyda5-gV5j0VPf-bXb2miCiI',
        },
        {
          uid: '04:77:B2:11:CC:2E:41',
          tagLabel: 'NFC-BATCH-9018',
          keccakHash: '0xaa982f1b4482012c9a1802f94b199c8182e21c04',
          tokenId: '#091-AR01',
          productId: createdProducts['SKU-VR-BMB-014'].id,
          ownerUserId: null,
          garmentTitle: 'Structural Modular Trench Coat',
          sku: 'SKU-VR-BMB-014',
          colorway: 'Obsidian Black',
          size: 'L',
          acquiredLabel: 'ATELIER VAULT',
          valuationUsd: 1450,
          editionRun: 'RUN 01/100 // ED. #091',
          textileSpec: '440 GSM Japanese Cordura Membrane',
          siliconLocation: 'Left Chest Interior Badge Plate',
          smartPerk: 'Lifetime Membrane Care + Tier 01 Concierge',
          warehouseNode: 'London Mayfair Suite',
          status: 'PENDING_SEEDING',
          imageUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuDt97XhhzoPY1d-I-EXLpHP5ZUk0GALnauRSG2nWiZw2iEpFp3W2OjSFF1Yn0keqe0siwKDfvVNvWBfQVQdsy4CnaK_o_FVZ1VoifczsROm47KiCfoo2OWGxSBr0yHmPSdkQiXZtxwFQZjJUx11it1IefAHXKKs1tPrG0wXK8ifJASyHankjn1EgcpPElSuA8dFHa08t91BhHN7JW32kM9VYyZ4FEfraJdfP-kv2Go',
        },
      ],
    });

    await this.prisma.vaultTransfer.createMany({
      data: [
        {
          receiptCode: 'REC-2025-08192-COL-LON',
          artifactId: nfcBomber.id,
          fromOwnerName: 'Alexander Wright',
          fromWallet: '0x7F91a8C3E40B18F004192C4e',
          toOwnerName: 'Julian De Silva',
          toWallet: '0x3B89e1F4D99100B32E496DAE',
          transferMethod: 'HEX',
          valuationUsd: 980,
          royaltyUsd: 49,
          gasMatic: '0.0000 MATIC',
          txHash: '0x94a2b81f892c3e1d902a14ff72181099e71a9c42',
          blockNumber: 64819204,
          networkName: 'Polygon PoS // Atelier Rollup',
          status: 'CONFIRMED',
          reassignedPerksJson: JSON.stringify([
            'Priority Membrane Care & Waterproof Servicing',
            'Secondary Resale Authenticity Seal',
            'Colombo / London Atelier Custody Check-In',
          ]),
        },
        {
          receiptCode: 'REC-2025-07411-CMB-01',
          artifactId: nfcTee.id,
          fromOwnerName: 'VERSSARO Atelier Mint',
          fromWallet: '0x00000000000000ATELIER01',
          toOwnerName: 'Alexander Wright',
          toWallet: '0x7F91a8C3E40B18F004192C4e',
          transferMethod: 'HEX',
          valuationUsd: 240,
          royaltyUsd: 12,
          gasMatic: '0.0000 MATIC',
          txHash: '0x6281c112a98b0072d8c93e442c01f98902a741b2',
          blockNumber: 64201418,
          networkName: 'Polygon PoS // Atelier Rollup',
          status: 'CONFIRMED',
          reassignedPerksJson: JSON.stringify([
            'Lifetime Complimentary Cold-Wash Restorations',
            '24H Early Drop Whitelist Eligibility',
          ]),
        },
      ],
    });

    await this.prisma.stockMovement.createMany({
      data: [
        {
          productId: createdProducts['SKU-VR-BMB-014'].id,
          sku: 'SKU-VR-BMB-014',
          garmentTitle: 'Structural Modular Trench Coat',
          fromNode: 'Colombo Flagship',
          toNode: 'London Mayfair Suite',
          quantity: 2,
          movementType: 'INTER_VAULT',
          initiatedBy: 'LAKSHAN P.',
          referenceCode: 'MV-2025-1041',
          status: 'COMPLETED',
        },
        {
          productId: createdProducts['VSR-HOD-082'].id,
          sku: 'VSR-HOD-082',
          garmentTitle: 'Heavy Fleece Capsule Hoodie',
          fromNode: 'Colombo Atelier Mill',
          toNode: 'Dubai Private Vault',
          quantity: 4,
          movementType: 'REPLENISHMENT',
          initiatedBy: 'TARA M.',
          referenceCode: 'MV-2025-1048',
          status: 'IN_TRANSIT',
        },
        {
          productId: createdProducts['VR-01-TEE-BLK'].id,
          sku: 'VR-01-TEE-BLK',
          garmentTitle: 'Archive 01 Oversized Tee',
          fromNode: 'London Mayfair Suite',
          toNode: 'Colombo Flagship',
          quantity: 5,
          movementType: 'INTER_VAULT',
          initiatedBy: 'SARA K.',
          referenceCode: 'MV-2025-1052',
          status: 'COMPLETED',
        },
      ],
    });

    this.logger.log('VERSSARO seed complete.');
  }
}

