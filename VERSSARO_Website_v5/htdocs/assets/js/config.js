/* =====================================================================
 * VERSSARO — EDITABLE SITE CONFIG
 * Edit this file to change products, prices and contact details.
 * Prices stay null (shown as "Price on enquiry") until real figures exist.
 * orderWhatsapp: digits only incl. country code, e.g. '94771234567'.
 * ===================================================================== */
window.VERSSARO_CONFIG = {
  siteName: 'VERSSARO',
  socialInstagram: 'https://www.instagram.com/verssaro/',
  orderWhatsapp: '',
  orderEmail: '',
  currency: 'LKR',
  shippingMessage: 'Availability, pricing and delivery are confirmed on enquiry.',
  products: [
    {
      id: 'guardian', name: 'Guardian of the Flame', t1: 'Guardian of', t2: 'the Flame',
      edition: 'Artist Series / 001', colour: 'Black', price: null, sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      lead: 'For those who carry fire.',
      story: 'A guardian of protection and courage, mid-stride with sword and flame. Reimagined for today as a symbol of identity and bold self-expression.',
      details: ['Oversized fit', 'Back story print', 'Front emblem', 'Black', 'Gift boxed'],
      photo: 'assets/img/p-guardian.webp', lifestyle: 'assets/img/guardian-pair.webp',
      gallery: ['assets/img/p-guardian.webp', 'assets/img/guardian-pair.webp', 'assets/img/box-black.webp'],
      accent: '#C2412F', tex: 'guardian'
    },
    {
      id: 'mayara', name: 'Mayara', t1: 'The peacock', t2: 'Mayara',
      edition: 'Artist Series / 002', colour: 'Black', price: null, sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      lead: 'Movement in every detail.',
      story: 'A dancer crowned in peacock plumes, staff in hand, wrapped in a storm of colour. Vivid on black, quiet everywhere else.',
      details: ['Oversized fit', 'Full back print', 'Front emblem', 'Black', 'Gift boxed'],
      photo: 'assets/img/p-mayara.webp', lifestyle: 'assets/img/mayara-full.webp',
      gallery: ['assets/img/p-mayara.webp', 'assets/img/mayara-full.webp', 'assets/img/highlands.webp'],
      accent: '#2D8F86', tex: 'mayara'
    },
    {
      id: 'ivory', name: 'The Ivory Edit', t1: 'The dancer', t2: 'Ivory Edit',
      edition: 'Artist Series / 003', colour: 'Ivory', price: null, sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      lead: 'Art against the quiet.',
      story: 'A Kandyan-inspired dancer in full adornment, drawn in gold, crimson and ink on a warm ivory canvas.',
      details: ['Oversized fit', 'Front print', 'Ivory', 'Gift boxed'],
      photo: 'assets/img/p-ivory.webp', lifestyle: 'assets/img/box-ivory.webp',
      gallery: ['assets/img/p-ivory.webp', 'assets/img/box-ivory.webp', 'assets/img/hanging-trio.webp'],
      accent: '#E3D3AE', tex: 'ivory'
    },
    {
      id: 'highlands', name: 'Highlands Edition', t1: 'Earth tone', t2: 'Highlands',
      edition: 'The Editorial / 004', colour: 'Earth brown', price: null, sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      lead: 'The world is your runway.',
      story: 'The Guardian and Mayara prints on an earth-brown base, photographed in the tea country at dusk. Availability confirmed on enquiry.',
      details: ['Oversized fit', 'Back print', 'Earth brown', 'Guardian or Mayara artwork'],
      photo: 'assets/img/p-highlands.webp', lifestyle: 'assets/img/highlands.webp',
      gallery: ['assets/img/p-highlands.webp', 'assets/img/highlands.webp'],
      accent: '#9A6142', tex: 'highlands'
    }
  ]
};
