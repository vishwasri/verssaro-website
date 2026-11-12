export type CurrencyCode = 'USD' | 'LKR' | 'EUR';

export interface Colorway {
  name: string;
  hex: string;
  slug: string;
}

export interface ProductSizeStock {
  size: string;
  stock: number;
  colombo: number;
  london: number;
  dubai: number;
}

export interface ProductMeasurement {
  size: string;
  chest: string;
  length: string;
  shoulder: string;
  sleeve: string;
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  seriesCode: string;
  name: string;
  subtitle: string;
  category: string;
  categoryLabel: string;
  capsule: string;
  editionLabel: string;
  priceUsd: number;
  compareAtUsd: number | null;
  cogsUsd: number;
  marginPercent: number;
  gsm: number | null;
  material: string;
  silhouette: string;
  description: string;
  fitNotes: string;
  careNotes: string;
  badge: string | null;
  status: 'LIVE' | 'UPCOMING' | 'DRAFT' | 'SOLD_OUT' | string;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewDrop: boolean;
  ratingAvg: number;
  reviewCount: number;
  colorways: Colorway[];
  sizes: ProductSizeStock[];
  totalStock: number;
  images: string[];
  measurements: ProductMeasurement[];
  nfcEnabled: boolean;
  siliconLocation: string;
  smartPerk: string;
}

export interface Review {
  id: string;
  productId: string;
  authorName: string;
  authorLocation: string;
  verifiedBuyer: boolean;
  rating: number;
  fitFeedback: string;
  title: string;
  body: string;
  sizePurchased: string;
  colorPurchased: string;
  helpfulCount: number;
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  slug: string;
  sku: string;
  name: string;
  category: string;
  badge: string | null;
  size: string;
  colorName: string;
  colorHex: string;
  quantity: number;
  unitPriceUsd: number;
  lineTotalUsd: number;
  stockRemaining: number;
  imageUrl: string;
}

export interface CartState {
  sessionId: string;
  items: CartItem[];
  itemCount: number;
  subtotalUsd: number;
  discountUsd: number;
  shippingUsd: number;
  dutyUsd: number;
  totalUsd: number;
  freeShippingThresholdUsd: number;
  amountToFreeShippingUsd: number;
  freeShipQualified: boolean;
  appliedPromo: {
    code: string;
    name: string;
    discountType: string;
    discountValue: number;
  } | null;
  collectorBox: boolean;
  giftMessage: string;
  reservedUntil: string;
  youMayAlsoLike: Product[];
}

export interface WishlistItem {
  id: string;
  productId: string;
  selectedSize: string;
  selectedColor: string;
  stockState: 'IN_STOCK' | 'LOW_STOCK' | 'PRE_ORDER' | string;
  product: Product;
}

export interface UserDossier {
  id: string;
  email: string;
  name: string;
  role: string;
  dossierCode: string;
  tier: string;
  vipActive: boolean;
  walletAddress: string;
  walletFull: string;
  atelierHub: string;
  phone: string | null;
  liaisonName: string;
  liaisonNotes: string;
  totalSpendUsd: number;
  restorationPassesRemaining: number;
  restorationPassesTotal: number;
  storeCreditUsd: number;
  kycStatus: string;
  recentLedgerNote: string | null;
}

export interface Address {
  id: string;
  label: string;
  classification: 'RESIDENTIAL' | 'OFFICE' | 'PRIVATE_VAULT' | string;
  isDefault: boolean;
  recipientName: string;
  company: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  province: string | null;
  postalCode: string;
  country: string;
  countryCode: string;
  phone: string;
  carrierPreference: string;
  deliveryInstructions: string | null;
  packagingSpec: string;
  coordinates: string | null;
}

export interface OrderItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  size: string;
  colorName: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string | null;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingMethod: string;
  carrierName: string;
  trackingNumber: string;
  destinationCode: string;
  shippingAddress: Record<string, string>;
  packagingManifest: {
    collectorBox?: boolean;
    dustBag?: string;
    giftMessage?: string;
  };
  subtotalUsd: number;
  discountUsd: number;
  shippingUsd: number;
  dutyUsd: number;
  totalUsd: number;
  promoCodeUsed: string | null;
  milestoneStep: number;
  createdAt: string;
  items: OrderItem[];
}

export interface NfcArtifact {
  id: string;
  uid: string;
  tagLabel: string;
  keccakHash: string;
  tokenId: string;
  contractAddress: string;
  productId: string | null;
  orderId: string | null;
  ownerUserId: string | null;
  ownerUser?: UserDossier | null;
  garmentTitle: string;
  sku: string;
  colorway: string;
  size: string;
  acquiredLabel: string;
  valuationUsd: number;
  editionRun: string;
  textileSpec: string;
  siliconLocation: string;
  smartPerk: string;
  warehouseNode: string;
  status: string;
  imageUrl: string;
  lastVerifiedAt: string;
}

export interface VaultTransferReceipt {
  id: string;
  receiptCode: string;
  artifactId: string;
  artifact?: NfcArtifact;
  fromOwnerName: string;
  fromWallet: string;
  toOwnerName: string;
  toWallet: string;
  transferMethod: string;
  valuationUsd: number;
  royaltyUsd: number;
  gasMatic: string;
  txHash: string;
  blockNumber: number;
  networkName: string;
  status: string;
  reassignedPerks: string[];
  fromWalletShort?: string;
  toWalletShort?: string;
  createdAt: string;
}

