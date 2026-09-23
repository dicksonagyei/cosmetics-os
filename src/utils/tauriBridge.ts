import {
  VariantDetail,
  Customer,
  CustomerLedgerEntry,
  Order,
  CreateOrderRequest,
  CreateOrderResponse,
  DashboardMetrics,
  SyncQueueItem,
  MasterCatalogProduct,
  StockAdjustmentRequest,
  StockAdjustmentReason,
  CsvImportProductRow,
} from '../types/pos';
import { buildReceiptEscPos } from './escpos';

// Check if running inside native Tauri runtime
const isTauri = () => {
  return (
    typeof window !== 'undefined' &&
    ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)
  );
};

// In-memory fallback mock data for local browser development & preview
const INITIAL_VARIANTS: VariantDetail[] = [
  {
    id: 'var_fenty_420',
    product_id: 'prod_fenty_foundation',
    product_name: "Pro Filt'r Soft Matte Longwear Foundation",
    brand: 'Fenty Beauty',
    category: 'Foundation',
    sku: 'FB-PF-420',
    barcode: '840000000001',
    shade_name: 'Shade #420 (Deep Neutral)',
    shade_code: '#5B3B2B',
    size_volume: '32ml / 1.08 fl oz',
    cost_price_cents: 1900,
    selling_price_cents: 3800,
    expiry_date: '2027-06-30',
    batch_number: 'LOT-FB420-24A',
    low_stock_threshold: 5,
    quantity_on_hand: 24,
    image_url: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'var_fenty_330',
    product_id: 'prod_fenty_foundation',
    product_name: "Pro Filt'r Soft Matte Longwear Foundation",
    brand: 'Fenty Beauty',
    category: 'Foundation',
    sku: 'FB-PF-330',
    barcode: '840000000002',
    shade_name: 'Shade #330 (Tan Warm)',
    shade_code: '#A26B47',
    size_volume: '32ml / 1.08 fl oz',
    cost_price_cents: 1900,
    selling_price_cents: 3800,
    expiry_date: '2027-06-30',
    batch_number: 'LOT-FB330-24A',
    low_stock_threshold: 5,
    quantity_on_hand: 18,
    image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'var_fenty_210',
    product_id: 'prod_fenty_foundation',
    product_name: "Pro Filt'r Soft Matte Longwear Foundation",
    brand: 'Fenty Beauty',
    category: 'Foundation',
    sku: 'FB-PF-210',
    barcode: '840000000003',
    shade_name: 'Shade #210 (Medium Neutral)',
    shade_code: '#C48F68',
    size_volume: '32ml / 1.08 fl oz',
    cost_price_cents: 1900,
    selling_price_cents: 3800,
    expiry_date: '2027-05-15',
    batch_number: 'LOT-FB210-24B',
    low_stock_threshold: 5,
    quantity_on_hand: 12,
    image_url: 'https://images.unsplash.com/photo-1599733589046-10c005739ef9?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'var_fenty_120',
    product_id: 'prod_fenty_foundation',
    product_name: "Pro Filt'r Soft Matte Longwear Foundation",
    brand: 'Fenty Beauty',
    category: 'Foundation',
    sku: 'FB-PF-120',
    barcode: '840000000004',
    shade_name: 'Shade #120 (Fair Warm)',
    shade_code: '#E5BCA0',
    size_volume: '32ml / 1.08 fl oz',
    cost_price_cents: 1900,
    selling_price_cents: 3800,
    expiry_date: '2027-04-10',
    batch_number: 'LOT-FB120-24B',
    low_stock_threshold: 5,
    quantity_on_hand: 8,
    image_url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'var_mac_rubywoo',
    product_id: 'prod_mac_lipstick',
    product_name: 'Retro Matte Lipstick',
    brand: 'M·A·C Cosmetics',
    category: 'Lipstick',
    sku: 'MAC-RM-RW',
    barcode: '773602000010',
    shade_name: 'Ruby Woo (Vivid Blue-Red)',
    shade_code: '#8D021F',
    size_volume: '3g / 0.1 oz',
    cost_price_cents: 1000,
    selling_price_cents: 2200,
    expiry_date: '2027-12-31',
    batch_number: 'MAC-RW-2024',
    low_stock_threshold: 5,
    quantity_on_hand: 35,
    image_url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'var_mac_velvet_teddy',
    product_id: 'prod_mac_lipstick',
    product_name: 'Retro Matte Lipstick',
    brand: 'M·A·C Cosmetics',
    category: 'Lipstick',
    sku: 'MAC-RM-VT',
    barcode: '773602000011',
    shade_name: 'Velvet Teddy (Deep Beige)',
    shade_code: '#965B54',
    size_volume: '3g / 0.1 oz',
    cost_price_cents: 1000,
    selling_price_cents: 2200,
    expiry_date: '2027-11-30',
    batch_number: 'MAC-VT-2024',
    low_stock_threshold: 5,
    quantity_on_hand: 4, // Low stock
    image_url: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'var_mac_whirl',
    product_id: 'prod_mac_lipstick',
    product_name: 'Retro Matte Lipstick',
    brand: 'M·A·C Cosmetics',
    category: 'Lipstick',
    sku: 'MAC-RM-WH',
    barcode: '773602000012',
    shade_name: 'Whirl (Dirty Rose)',
    shade_code: '#7E4B48',
    size_volume: '3g / 0.1 oz',
    cost_price_cents: 1000,
    selling_price_cents: 2200,
    expiry_date: '2027-10-15',
    batch_number: 'MAC-WH-2024',
    low_stock_threshold: 5,
    quantity_on_hand: 15,
    image_url: 'https://images.unsplash.com/photo-1591360236480-4ed861025fa1?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'var_ord_nia_30ml',
    product_id: 'prod_ordinary_niacinamide',
    product_name: 'Niacinamide 10% + Zinc 1%',
    brand: 'The Ordinary',
    category: 'Skincare Serums',
    sku: 'TO-NIA-30ML',
    barcode: '769915190011',
    shade_name: 'Clear Serum',
    shade_code: '#E2E8F0',
    size_volume: '30ml',
    cost_price_cents: 320,
    selling_price_cents: 650,
    expiry_date: '2026-11-30',
    batch_number: 'TO-N30-891',
    low_stock_threshold: 10,
    quantity_on_hand: 42,
    image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'var_ord_nia_60ml',
    product_id: 'prod_ordinary_niacinamide',
    product_name: 'Niacinamide 10% + Zinc 1%',
    brand: 'The Ordinary',
    category: 'Skincare Serums',
    sku: 'TO-NIA-60ML',
    barcode: '769915190012',
    shade_name: 'Clear Serum',
    shade_code: '#E2E8F0',
    size_volume: '60ml',
    cost_price_cents: 550,
    selling_price_cents: 1150,
    expiry_date: '2026-11-30',
    batch_number: 'TO-N60-892',
    low_stock_threshold: 8,
    quantity_on_hand: 20,
    image_url: 'https://images.unsplash.com/photo-1608248597359-251663f73685?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'var_cerave_236ml',
    product_id: 'prod_cerave_cleanser',
    product_name: 'Hydrating Facial Cleanser',
    brand: 'CeraVe',
    category: 'Cleansers',
    sku: 'CV-HYD-236',
    barcode: '333787559718',
    shade_name: 'Hydrating Cream Lotion',
    shade_code: '#CBD5E1',
    size_volume: '236ml',
    cost_price_cents: 800,
    selling_price_cents: 1499,
    expiry_date: '2027-08-31',
    batch_number: 'CV-236-09',
    low_stock_threshold: 5,
    quantity_on_hand: 16,
    image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'var_abh_softglam_std',
    product_id: 'prod_abh_softglam',
    product_name: 'Soft Glam Eye Shadow Palette',
    brand: 'Anastasia Beverly Hills',
    category: 'Eyeshadow',
    sku: 'ABH-SG-PAL',
    barcode: '689304181827',
    shade_name: '14 Neutral Pigments',
    shade_code: '#D97706',
    size_volume: '0.74g x 14',
    cost_price_cents: 2200,
    selling_price_cents: 4500,
    expiry_date: '2028-01-01',
    batch_number: 'ABH-SG-01',
    low_stock_threshold: 3,
    quantity_on_hand: 7,
    image_url: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'var_mayb_lifter_02',
    product_id: 'prod_maybelline_lifter',
    product_name: 'Lifter Gloss with Hyaluronic Acid',
    brand: 'Maybelline New York',
    category: 'Lip Gloss',
    sku: 'MAYB-LG-02',
    barcode: '041554583809',
    shade_name: '002 Ice (Clear Shimmer)',
    shade_code: '#FCE7F3',
    size_volume: '5.4ml',
    cost_price_cents: 450,
    selling_price_cents: 999,
    expiry_date: '2027-04-30',
    batch_number: 'MB-LG02-1',
    low_stock_threshold: 5,
    quantity_on_hand: 25,
    image_url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'var_mayb_lifter_08',
    product_id: 'prod_maybelline_lifter',
    product_name: 'Lifter Gloss with Hyaluronic Acid',
    brand: 'Maybelline New York',
    category: 'Lip Gloss',
    sku: 'MAYB-LG-08',
    barcode: '041554583811',
    shade_name: '008 Stone (Cool Mauve)',
    shade_code: '#9B626C',
    size_volume: '5.4ml',
    cost_price_cents: 450,
    selling_price_cents: 999,
    expiry_date: '2027-04-30',
    batch_number: 'MB-LG08-1',
    low_stock_threshold: 5,
    quantity_on_hand: 3, // Low stock
    image_url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'var_mfk_br540_70ml',
    product_id: 'prod_baccarat_rouge',
    product_name: 'Baccarat Rouge 540 Extrait de Parfum',
    brand: 'Maison Francis Kurkdjian',
    category: 'Fragrance',
    sku: 'MFK-BR540-70',
    barcode: '370055960001',
    shade_name: 'Amber Woody Floral',
    shade_code: '#F59E0B',
    size_volume: '70ml Extrait',
    cost_price_cents: 18000,
    selling_price_cents: 32500,
    expiry_date: '2029-12-31',
    batch_number: 'MFK-540-99',
    low_stock_threshold: 2,
    quantity_on_hand: 5,
    image_url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=300&q=80',
  },
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust_walkin',
    full_name: 'Walk-In Customer (Cash/Retail)',
    phone: '+0000000000',
    email: null,
    credit_limit_cents: 0,
    outstanding_balance_cents: 0,
    notes: 'Default customer for standard cash sales',
    created_at: new Date().toISOString(),
  },
  {
    id: 'cust_amina',
    full_name: 'Amina Sow (Glam Studio)',
    phone: '+233501234567',
    email: 'amina.sow@glamstudio.com',
    credit_limit_cents: 50000, // $500.00
    outstanding_balance_cents: 0,
    notes: 'VIP Makeup Artist. Approved 30-day credit term.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'cust_kwame',
    full_name: 'Kwame Mensah (Beauty Bar)',
    phone: '+233249876543',
    email: 'kwame@beautybargh.com',
    credit_limit_cents: 100000, // $1000.00
    outstanding_balance_cents: 12000, // $120.00
    notes: 'Wholesale reseller. Requires weekly settlement.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'cust_fatima',
    full_name: 'Fatima Zahra',
    phone: '+233201112233',
    email: 'fatima.z@gmail.com',
    credit_limit_cents: 20000, // $200.00
    outstanding_balance_cents: 0,
    notes: 'Frequent regular customer. Loves Fenty & Ordinary.',
    created_at: new Date().toISOString(),
  },
];

let mockVariants = [...INITIAL_VARIANTS];
let mockCustomers = [...INITIAL_CUSTOMERS];
let mockOrders: Order[] = [];
let mockLedger: CustomerLedgerEntry[] = [
  {
    id: 'led_init_kwame',
    customer_id: 'cust_kwame',
    order_id: null,
    transaction_type: 'DEBIT_SALE',
    amount_cents: 12000,
    balance_after_cents: 12000,
    recorded_by: 'SYSTEM_INIT',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];
let mockSyncQueue: SyncQueueItem[] = [];

/**
 * Main Bridge API for communicating with backend (Native Tauri or Mock Edge)
 */
// Pre-configured Global Master Cosmetics Catalog
export const MASTER_BEAUTY_CATALOG: MasterCatalogProduct[] = [
  {
    id: 'master_rare_blush',
    name: 'Soft Pinch Liquid Blush',
    brand: 'Rare Beauty by Selena Gomez',
    category: 'Blush',
    description: 'Weightless, long-lasting liquid blush that blends and builds beautifully for a soft, healthy flush.',
    image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=300&q=80',
    variants: [
      {
        sku: 'RB-SPB-JOY',
        barcode: '840122900011',
        shade_name: 'Joy (Muted Peach)',
        shade_code: '#E3826F',
        size_volume: '7.5ml / 0.25 fl oz',
        default_cost_cents: 1100,
        suggested_retail_cents: 2300,
        initial_stock: 20,
      },
      {
        sku: 'RB-SPB-HAPPY',
        barcode: '840122900012',
        shade_name: 'Happy (Dewy Cool Pink)',
        shade_code: '#E57399',
        size_volume: '7.5ml / 0.25 fl oz',
        default_cost_cents: 1100,
        suggested_retail_cents: 2300,
        initial_stock: 18,
      },
      {
        sku: 'RB-SPB-ENCOURAGE',
        barcode: '840122900013',
        shade_name: 'Encourage (Soft Neutral Pink)',
        shade_code: '#B85B6C',
        size_volume: '7.5ml / 0.25 fl oz',
        default_cost_cents: 1100,
        suggested_retail_cents: 2300,
        initial_stock: 15,
      },
      {
        sku: 'RB-SPB-HOPE',
        barcode: '840122900014',
        shade_name: 'Hope (Nude Mauve)',
        shade_code: '#C67A7D',
        size_volume: '7.5ml / 0.25 fl oz',
        default_cost_cents: 1100,
        suggested_retail_cents: 2300,
        initial_stock: 12,
      },
    ],
  },
  {
    id: 'master_huda_powder',
    name: 'Easy Bake Loose Baking & Setting Powder',
    brand: 'Huda Beauty',
    category: 'Setting Powder',
    description: 'Extremely light and silky texture that blends seamlessly into the skin leaving a luminous matte finish.',
    image_url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=300&q=80',
    variants: [
      {
        sku: 'HUDA-EB-POUND',
        barcode: '629110603001',
        shade_name: 'Pound Cake (Fair to Medium)',
        shade_code: '#F5E6D3',
        size_volume: '20g / 0.71 oz',
        default_cost_cents: 1700,
        suggested_retail_cents: 3800,
        initial_stock: 24,
      },
      {
        sku: 'HUDA-EB-BANANA',
        barcode: '629110603002',
        shade_name: 'Banana Bread (Medium Tan)',
        shade_code: '#E8CA97',
        size_volume: '20g / 0.71 oz',
        default_cost_cents: 1700,
        suggested_retail_cents: 3800,
        initial_stock: 20,
      },
      {
        sku: 'HUDA-EB-KUNAFA',
        barcode: '629110603003',
        shade_name: 'Kunafa (Deep Tan to Rich)',
        shade_code: '#C68E56',
        size_volume: '20g / 0.71 oz',
        default_cost_cents: 1700,
        suggested_retail_cents: 3800,
        initial_stock: 16,
      },
      {
        sku: 'HUDA-EB-CHERRY',
        barcode: '629110603004',
        shade_name: 'Cherry Blossom (Brightening Pink)',
        shade_code: '#FBD4D9',
        size_volume: '20g / 0.71 oz',
        default_cost_cents: 1700,
        suggested_retail_cents: 3800,
        initial_stock: 14,
      },
    ],
  },
  {
    id: 'master_nars_concealer',
    name: 'Radiant Creamy Concealer',
    brand: 'NARS Cosmetics',
    category: 'Concealer',
    description: 'Award-winning multi-action concealer that obscures imperfections and delivers 16-hour hydration.',
    image_url: 'https://images.unsplash.com/photo-1599733589046-10c005739ef9?auto=format&fit=crop&w=300&q=80',
    variants: [
      {
        sku: 'NARS-RCC-CUST',
        barcode: '607845012341',
        shade_name: 'Custard (Medium 1)',
        shade_code: '#DDB892',
        size_volume: '6ml / 0.22 fl oz',
        default_cost_cents: 1500,
        suggested_retail_cents: 3200,
        initial_stock: 15,
      },
      {
        sku: 'NARS-RCC-CARAM',
        barcode: '607845012342',
        shade_name: 'Caramel (Medium-Dark 2)',
        shade_code: '#B07D53',
        size_volume: '6ml / 0.22 fl oz',
        default_cost_cents: 1500,
        suggested_retail_cents: 3200,
        initial_stock: 12,
      },
      {
        sku: 'NARS-RCC-AMANDE',
        barcode: '607845012343',
        shade_name: 'Amande (Medium-Dark 3)',
        shade_code: '#844D32',
        size_volume: '6ml / 0.22 fl oz',
        default_cost_cents: 1500,
        suggested_retail_cents: 3200,
        initial_stock: 10,
      },
    ],
  },
  {
    id: 'master_fenty_gloss',
    name: 'Gloss Bomb Universal Lip Luminizer',
    brand: 'Fenty Beauty',
    category: 'Lip Gloss',
    description: 'The ultimate gotta-have-it lip gloss with explosive shine that feels as good as it looks.',
    image_url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=300&q=80',
    variants: [
      {
        sku: 'FB-GB-GLOW',
        barcode: '840000001001',
        shade_name: 'Fenty Glow (Shimmering Rose Nude)',
        shade_code: '#B86F5D',
        size_volume: '9ml / 0.3 fl oz',
        default_cost_cents: 1000,
        suggested_retail_cents: 2100,
        initial_stock: 30,
      },
      {
        sku: 'FB-GB-FUSSY',
        barcode: '840000001002',
        shade_name: 'Fu$$y (Shimmering Pink)',
        shade_code: '#DE899B',
        size_volume: '9ml / 0.3 fl oz',
        default_cost_cents: 1000,
        suggested_retail_cents: 2100,
        initial_stock: 22,
      },
      {
        sku: 'FB-GB-HOTCHOC',
        barcode: '840000001003',
        shade_name: 'Hot Chocolit (Rich Shimmering Brown)',
        shade_code: '#5C382A',
        size_volume: '9ml / 0.3 fl oz',
        default_cost_cents: 1000,
        suggested_retail_cents: 2100,
        initial_stock: 18,
      },
    ],
  },
  {
    id: 'master_ct_powder',
    name: 'Airbrush Flawless Finish Micro-Powder',
    brand: 'Charlotte Tilbury',
    category: 'Setting Powder',
    description: 'Complexion-enhancing micro-powder with soft-focus effect that smooths pores and perfects skin tone.',
    image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80',
    variants: [
      {
        sku: 'CT-AFF-02MED',
        barcode: '506054272002',
        shade_name: '2 Medium (Warm Beige)',
        shade_code: '#DEB887',
        size_volume: '8g / 0.28 oz',
        default_cost_cents: 2200,
        suggested_retail_cents: 4800,
        initial_stock: 10,
      },
      {
        sku: 'CT-AFF-03TAN',
        barcode: '506054272003',
        shade_name: '3 Tan (Golden Honey)',
        shade_code: '#B8860B',
        size_volume: '8g / 0.28 oz',
        default_cost_cents: 2200,
        suggested_retail_cents: 4800,
        initial_stock: 8,
      },
      {
        sku: 'CT-AFF-04DEEP',
        barcode: '506054272004',
        shade_name: '4 Deep (Rich Bronze)',
        shade_code: '#663300',
        size_volume: '8g / 0.28 oz',
        default_cost_cents: 2200,
        suggested_retail_cents: 4800,
        initial_stock: 6,
      },
    ],
  },
  {
    id: 'master_dior_lipoil',
    name: 'Dior Addict Lip Glow Oil',
    brand: 'Dior Beauty',
    category: 'Lip Care',
    description: 'Nourishing glossy lip oil infused with cherry oil that intensely protects, enhances and beautifies lips.',
    image_url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=300&q=80',
    variants: [
      {
        sku: 'DIOR-LGO-001',
        barcode: '334890150001',
        shade_name: '001 Pink (Delicate Pink)',
        shade_code: '#F79AC0',
        size_volume: '6ml / 0.2 fl oz',
        default_cost_cents: 2000,
        suggested_retail_cents: 4000,
        initial_stock: 14,
      },
      {
        sku: 'DIOR-LGO-012',
        barcode: '334890150012',
        shade_name: '012 Rosewood (Rose Nude)',
        shade_code: '#C46270',
        size_volume: '6ml / 0.2 fl oz',
        default_cost_cents: 2000,
        suggested_retail_cents: 4000,
        initial_stock: 12,
      },
      {
        sku: 'DIOR-LGO-020',
        barcode: '334890150020',
        shade_name: '020 Mahogany (Deep Warm Brown)',
        shade_code: '#7B3B2B',
        size_volume: '6ml / 0.2 fl oz',
        default_cost_cents: 2000,
        suggested_retail_cents: 4000,
        initial_stock: 10,
      },
    ],
  },
];

let mockAdjustmentRequests: StockAdjustmentRequest[] = [
  {
    id: 'adj_init_01',
    variant_id: 'var_fenty_420',
    product_name: "Pro Filt'r Soft Matte Longwear Foundation",
    brand: 'Fenty Beauty',
    shade_name: 'Shade #420 (Deep Neutral)',
    sku: 'FB-PF-420',
    barcode: '840000000001',
    previous_quantity: 24,
    new_quantity: 22,
    quantity_delta: -2,
    reason: 'DAMAGED_TESTER',
    notes: '2 bottles opened and marked as display testers at the makeup counter.',
    requested_by: 'Ama (Floor Assistant)',
    requested_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'PENDING_APPROVAL',
  },
];

export const api = {
  async getVariants(): Promise<VariantDetail[]> {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      return invoke<VariantDetail[]>('get_variants');
    }
    return [...mockVariants];
  },

  async searchVariants(query: string): Promise<VariantDetail[]> {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      return invoke<VariantDetail[]>('search_variants', { query });
    }
    const q = query.toLowerCase().trim();
    if (!q) return [...mockVariants];
    return mockVariants.filter(
      (v) =>
        v.barcode.includes(q) ||
        v.sku.toLowerCase().includes(q) ||
        v.product_name.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        (v.shade_name && v.shade_name.toLowerCase().includes(q))
    );
  },

  async getVariantByBarcode(barcode: string): Promise<VariantDetail | null> {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      return invoke<VariantDetail | null>('get_variant_by_barcode', { barcode });
    }
    const match = mockVariants.find((v) => v.barcode === barcode.trim());
    return match ? { ...match } : null;
  },

  async getMasterCatalog(): Promise<MasterCatalogProduct[]> {
    return [...MASTER_BEAUTY_CATALOG];
  },

  async importMasterProducts(productIds: string[]): Promise<number> {
    let importedCount = 0;
    const selected = MASTER_BEAUTY_CATALOG.filter((p) => productIds.includes(p.id));

    for (const prod of selected) {
      for (const v of prod.variants) {
        const existing = mockVariants.find((mv) => mv.barcode === v.barcode || mv.sku === v.sku);
        if (!existing) {
          mockVariants.push({
            id: `var_master_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            product_id: `prod_${prod.id}`,
            product_name: prod.name,
            brand: prod.brand,
            category: prod.category,
            sku: v.sku,
            barcode: v.barcode,
            shade_name: v.shade_name,
            shade_code: v.shade_code,
            size_volume: v.size_volume,
            cost_price_cents: v.default_cost_cents,
            selling_price_cents: v.suggested_retail_cents,
            expiry_date: '2028-06-30',
            batch_number: `LOT-IMP-${Date.now().toString().slice(-4)}`,
            low_stock_threshold: 5,
            quantity_on_hand: v.initial_stock,
            image_url: prod.image_url,
          });
          importedCount++;
        }
      }
    }

    mockSyncQueue.push({
      id: `sync_imp_${Date.now()}`,
      event_type: 'STOCK_RECEIVED',
      payload: JSON.stringify({ importedProductsCount: selected.length, importedVariantsCount: importedCount }),
      status: 'PENDING',
      retry_count: 0,
      created_at: new Date().toISOString(),
    });

    return importedCount;
  },

  async importCsvProducts(rows: CsvImportProductRow[]): Promise<number> {
    let count = 0;
    for (const r of rows) {
      const existing = mockVariants.find((mv) => mv.barcode === r.barcode || mv.sku === r.sku);
      if (existing) {
        existing.quantity_on_hand += r.quantity_on_hand;
        count++;
      } else {
        mockVariants.push({
          id: `var_csv_${Date.now()}_${count}`,
          product_id: `prod_csv_${Date.now()}`,
          product_name: r.product_name,
          brand: r.brand,
          category: r.category,
          sku: r.sku,
          barcode: r.barcode,
          shade_name: r.shade_name || null,
          shade_code: r.shade_code || null,
          size_volume: r.size_volume || null,
          cost_price_cents: r.cost_price_cents,
          selling_price_cents: r.selling_price_cents,
          expiry_date: r.expiry_date || null,
          batch_number: r.batch_number || null,
          low_stock_threshold: 5,
          quantity_on_hand: r.quantity_on_hand,
          image_url: r.image_url || null,
        });
        count++;
      }
    }

    mockSyncQueue.push({
      id: `sync_csv_${Date.now()}`,
      event_type: 'STOCK_RECEIVED',
      payload: JSON.stringify({ rowsImported: count }),
      status: 'PENDING',
      retry_count: 0,
      created_at: new Date().toISOString(),
    });

    return count;
  },

  async createProductWithVariants(data: {
    product_name: string;
    brand: string;
    category: string;
    description?: string;
    image_url?: string;
    variants: {
      sku: string;
      barcode: string;
      shade_name?: string;
      shade_code?: string;
      size_volume?: string;
      cost_price_cents: number;
      selling_price_cents: number;
      expiry_date?: string;
      batch_number?: string;
      low_stock_threshold?: number;
      quantity_on_hand: number;
    }[];
  }): Promise<VariantDetail[]> {
    const prodId = `prod_${Date.now()}`;
    const newItems: VariantDetail[] = [];

    for (const v of data.variants) {
      const newVar: VariantDetail = {
        id: `var_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        product_id: prodId,
        product_name: data.product_name,
        brand: data.brand,
        category: data.category,
        sku: v.sku,
        barcode: v.barcode,
        shade_name: v.shade_name || null,
        shade_code: v.shade_code || null,
        size_volume: v.size_volume || null,
        cost_price_cents: v.cost_price_cents,
        selling_price_cents: v.selling_price_cents,
        expiry_date: v.expiry_date || null,
        batch_number: v.batch_number || null,
        low_stock_threshold: v.low_stock_threshold || 5,
        quantity_on_hand: v.quantity_on_hand,
        image_url: data.image_url || null,
      };
      mockVariants.unshift(newVar);
      newItems.push(newVar);
    }

    mockSyncQueue.push({
      id: `sync_newprod_${Date.now()}`,
      event_type: 'STOCK_RECEIVED',
      payload: JSON.stringify({ productName: data.product_name, variantsCount: newItems.length }),
      status: 'PENDING',
      retry_count: 0,
      created_at: new Date().toISOString(),
    });

    return newItems;
  },

  async getStockAdjustmentRequests(): Promise<StockAdjustmentRequest[]> {
    return [...mockAdjustmentRequests].sort(
      (a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
    );
  },

  async requestStockAdjustment(data: {
    variant_id: string;
    new_quantity: number;
    reason: StockAdjustmentReason;
    notes?: string;
    requested_by: string;
  }): Promise<StockAdjustmentRequest> {
    const variant = mockVariants.find((v) => v.id === data.variant_id);
    if (!variant) throw new Error('Variant not found');

    const previousQty = variant.quantity_on_hand;
    const delta = data.new_quantity - previousQty;

    const req: StockAdjustmentRequest = {
      id: `adj_${Date.now()}`,
      variant_id: variant.id,
      product_name: variant.product_name,
      brand: variant.brand,
      shade_name: variant.shade_name,
      sku: variant.sku,
      barcode: variant.barcode,
      previous_quantity: previousQty,
      new_quantity: data.new_quantity,
      quantity_delta: delta,
      reason: data.reason,
      notes: data.notes || null,
      requested_by: data.requested_by,
      requested_at: new Date().toISOString(),
      status: 'PENDING_APPROVAL',
    };

    mockAdjustmentRequests.unshift(req);
    return req;
  },

  async approveStockAdjustment(requestId: string, reviewerName: string): Promise<StockAdjustmentRequest> {
    const req = mockAdjustmentRequests.find((r) => r.id === requestId);
    if (!req) throw new Error('Adjustment request not found');
    if (req.status !== 'PENDING_APPROVAL') throw new Error('Request already processed');

    const variant = mockVariants.find((v) => v.id === req.variant_id);
    if (variant) {
      variant.quantity_on_hand = req.new_quantity;
    }

    req.status = 'APPROVED';
    req.reviewed_by = reviewerName;
    req.reviewed_at = new Date().toISOString();

    mockSyncQueue.push({
      id: `sync_adj_${req.id}`,
      event_type: 'STOCK_ADJUSTED',
      payload: JSON.stringify({
        variantId: req.variant_id,
        sku: req.sku,
        previousQty: req.previous_quantity,
        newQty: req.new_quantity,
        delta: req.quantity_delta,
        reason: req.reason,
        approvedBy: reviewerName,
      }),
      status: 'PENDING',
      retry_count: 0,
      created_at: new Date().toISOString(),
    });

    return req;
  },

  async rejectStockAdjustment(requestId: string, reviewerName: string, reason?: string): Promise<StockAdjustmentRequest> {
    const req = mockAdjustmentRequests.find((r) => r.id === requestId);
    if (!req) throw new Error('Adjustment request not found');
    if (req.status !== 'PENDING_APPROVAL') throw new Error('Request already processed');

    req.status = 'REJECTED';
    req.reviewed_by = reviewerName;
    req.reviewed_at = new Date().toISOString();
    req.rejection_reason = reason || 'Declined by Store Manager';

    return req;
  },

  async getCustomers(): Promise<Customer[]> {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      return invoke<Customer[]>('get_customers');
    }
    return [...mockCustomers];
  },

  async getCustomerLedger(customerId: string): Promise<CustomerLedgerEntry[]> {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      return invoke<CustomerLedgerEntry[]>('get_customer_ledger', { customerId });
    }
    return mockLedger
      .filter((l) => l.customer_id === customerId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async createCustomer(data: {
    fullName: string;
    phone: string;
    email?: string;
    creditLimitCents: number;
    notes?: string;
  }): Promise<Customer> {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      return invoke<Customer>('create_customer', {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        creditLimitCents: data.creditLimitCents,
        notes: data.notes,
      });
    }

    const newCust: Customer = {
      id: `cust_${Date.now()}`,
      full_name: data.fullName,
      phone: data.phone,
      email: data.email || null,
      credit_limit_cents: data.creditLimitCents,
      outstanding_balance_cents: 0,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
    };
    mockCustomers.push(newCust);
    return newCust;
  },

  async recordCustomerPayment(data: {
    customerId: string;
    amountCents: number;
    recordedBy: string;
    referenceNo?: string;
  }): Promise<Customer> {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      return invoke<Customer>('record_customer_payment', {
        customerId: data.customerId,
        amountCents: data.amountCents,
        recordedBy: data.recordedBy,
        referenceNo: data.referenceNo,
      });
    }

    const cust = mockCustomers.find((c) => c.id === data.customerId);
    if (!cust) throw new Error('Customer not found');

    cust.outstanding_balance_cents = Math.max(0, cust.outstanding_balance_cents - data.amountCents);
    mockLedger.push({
      id: `led_pay_${Date.now()}`,
      customer_id: cust.id,
      order_id: null,
      transaction_type: 'CREDIT_PAYMENT',
      amount_cents: data.amountCents,
      balance_after_cents: cust.outstanding_balance_cents,
      recorded_by: data.recordedBy,
      created_at: new Date().toISOString(),
    });

    mockSyncQueue.push({
      id: `sync_pay_${Date.now()}`,
      event_type: 'CUSTOMER_PAYMENT',
      payload: JSON.stringify({ customerId: cust.id, amountCents: data.amountCents }),
      status: 'PENDING',
      retry_count: 0,
      created_at: new Date().toISOString(),
    });

    return { ...cust };
  },

  async createOrder(req: CreateOrderRequest): Promise<CreateOrderResponse> {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      return invoke<CreateOrderResponse>('create_order', { req });
    }

    const now = new Date().toISOString();
    const orderId = `ord_${Date.now()}`;
    const totalPaid = req.payments.reduce((sum, p) => sum + p.amount_cents, 0);
    const hasCredit = req.payments.some((p) => p.payment_method === 'CREDIT');
    const creditPayment = req.payments.find((p) => p.payment_method === 'CREDIT');

    const paymentStatus = hasCredit
      ? 'CREDIT'
      : totalPaid >= req.total_cents
      ? 'PAID'
      : 'PARTIAL';

    const order: Order = {
      id: orderId,
      branch_id: req.branch_id,
      register_id: req.register_id,
      cashier_id: req.cashier_id,
      customer_id: req.customer_id || null,
      subtotal_cents: req.subtotal_cents,
      discount_cents: req.discount_cents,
      tax_cents: req.tax_cents,
      total_cents: req.total_cents,
      payment_status: paymentStatus,
      sync_status: 'PENDING',
      created_at: now,
    };

    mockOrders.unshift(order);

    // Deduct stock
    const items = req.items.map((it, idx) => {
      const v = mockVariants.find((varItem) => varItem.id === it.variant_id);
      if (v) {
        v.quantity_on_hand = Math.max(0, v.quantity_on_hand - it.quantity);
      }
      return {
        id: `item_${orderId}_${idx}`,
        order_id: orderId,
        variant_id: it.variant_id,
        quantity: it.quantity,
        unit_price_cents: it.unit_price_cents,
        unit_cost_cents: it.unit_cost_cents,
        discount_cents: it.discount_cents,
        total_cents: it.total_cents,
        product_name: v?.product_name,
        brand: v?.brand,
        shade_name: v?.shade_name,
        size_volume: v?.size_volume,
        sku: v?.sku,
      };
    });

    // Handle customer credit update
    let customerObj: Customer | null = null;
    if (req.customer_id) {
      const c = mockCustomers.find((cust) => cust.id === req.customer_id);
      if (c) {
        if (creditPayment && creditPayment.amount_cents > 0) {
          c.outstanding_balance_cents += creditPayment.amount_cents;
          mockLedger.push({
            id: `led_${orderId}`,
            customer_id: c.id,
            order_id: orderId,
            transaction_type: 'DEBIT_SALE',
            amount_cents: creditPayment.amount_cents,
            balance_after_cents: c.outstanding_balance_cents,
            recorded_by: req.cashier_id,
            created_at: now,
          });
        }
        customerObj = { ...c };
      }
    }

    mockSyncQueue.push({
      id: `sync_${orderId}`,
      event_type: 'ORDER_CREATED',
      payload: JSON.stringify({ orderId, totalCents: req.total_cents }),
      status: 'PENDING',
      retry_count: 0,
      created_at: now,
    });

    // Generate ESC/POS raw bytes
    const escBytes = buildReceiptEscPos(
      {
        storeName: 'COSMETICS OS BEAUTY STORE',
        branchName: 'Main Mall Branch #01',
        phone: '+233 (0) 302 123 456',
        taxNumber: 'TIN-GH-890214',
        order,
        items,
        payments: req.payments,
        customer: customerObj,
        cashierName: req.cashier_id,
      },
      true
    );

    return {
      order,
      items,
      payments: req.payments.map((p, idx) => ({
        id: `pay_${orderId}_${idx}`,
        order_id: orderId,
        payment_method: p.payment_method,
        amount_cents: p.amount_cents,
        reference_no: p.reference_no,
        created_at: now,
      })),
      customer: customerObj,
      raw_escpos_bytes: Array.from(escBytes),
    };
  },

  async getOrders(limit = 50): Promise<Order[]> {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      return invoke<Order[]>('get_orders', { limit });
    }
    return mockOrders.slice(0, limit);
  },

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      return invoke<DashboardMetrics>('get_dashboard_metrics');
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayOrders = mockOrders.filter((o) => o.created_at.startsWith(todayStr));
    const todaySales = todayOrders.reduce((sum, o) => sum + o.total_cents, 0);
    const lowStockCount = mockVariants.filter((v) => v.quantity_on_hand <= v.low_stock_threshold).length;
    const invValue = mockVariants.reduce((sum, v) => sum + v.cost_price_cents * v.quantity_on_hand, 0);
    const creditDebt = mockCustomers.reduce((sum, c) => sum + c.outstanding_balance_cents, 0);
    const pendingSync = mockSyncQueue.filter((s) => s.status === 'PENDING').length;

    return {
      today_sales_cents: todaySales,
      today_orders_count: todayOrders.length,
      low_stock_count: lowStockCount,
      total_inventory_value_cents: invValue,
      total_outstanding_credit_cents: creditDebt,
      pending_sync_count: pendingSync,
    };
  },

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      return invoke<SyncQueueItem[]>('get_sync_queue');
    }
    return [...mockSyncQueue];
  },

  async printRawEscPos(bytes: number[]): Promise<boolean> {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      return invoke<boolean>('print_raw_escpos', { bytes });
    }
    console.log(`[ESC/POS Thermal Print Simulated] Sending ${bytes.length} bytes to printer.`);
    return true;
  },
};

