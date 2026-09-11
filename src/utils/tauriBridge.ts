import {
  VariantDetail,
  Customer,
  CustomerLedgerEntry,
  Order,
  CreateOrderRequest,
  CreateOrderResponse,
  DashboardMetrics,
  SyncQueueItem,
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
