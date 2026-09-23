export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  description?: string;
  created_at: string;
}

export interface VariantDetail {
  id: string;
  product_id: string;
  product_name: string;
  brand: string;
  category: string;
  sku: string;
  barcode: string;
  shade_name?: string | null;
  shade_code?: string | null; // Hex color code e.g. #8D021F
  size_volume?: string | null; // e.g. "32ml", "50g"
  cost_price_cents: number;
  selling_price_cents: number;
  expiry_date?: string | null;
  batch_number?: string | null;
  low_stock_threshold: number;
  quantity_on_hand: number;
  image_url?: string | null;
}

export interface CartItem {
  variant: VariantDetail;
  quantity: number;
  unit_price_cents: number;
  unit_cost_cents: number;
  discount_cents: number;
  total_cents: number;
}

export type PaymentMethod = 'CASH' | 'MOMO' | 'CARD' | 'CREDIT';

export interface PaymentItem {
  payment_method: PaymentMethod;
  amount_cents: number;
  reference_no?: string;
}

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  credit_limit_cents: number;
  outstanding_balance_cents: number;
  notes?: string | null;
  created_at: string;
}

export interface CustomerLedgerEntry {
  id: string;
  customer_id: string;
  order_id?: string | null;
  transaction_type: 'DEBIT_SALE' | 'CREDIT_PAYMENT';
  amount_cents: number;
  balance_after_cents: number;
  recorded_by: string;
  created_at: string;
}

export interface Order {
  id: string;
  branch_id: string;
  register_id: string;
  cashier_id: string;
  customer_id?: string | null;
  subtotal_cents: number;
  discount_cents: number;
  tax_cents: number;
  total_cents: number;
  payment_status: 'PAID' | 'PARTIAL' | 'CREDIT';
  sync_status: 'PENDING' | 'SYNCED';
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  quantity: number;
  unit_price_cents: number;
  unit_cost_cents: number;
  discount_cents: number;
  total_cents: number;
  product_name?: string;
  brand?: string;
  shade_name?: string | null;
  size_volume?: string | null;
  sku?: string;
}

export interface CreateOrderRequest {
  branch_id: string;
  register_id: string;
  cashier_id: string;
  customer_id?: string | null;
  subtotal_cents: number;
  discount_cents: number;
  tax_cents: number;
  total_cents: number;
  items: {
    variant_id: string;
    quantity: number;
    unit_price_cents: number;
    unit_cost_cents: number;
    discount_cents: number;
    total_cents: number;
  }[];
  payments: PaymentItem[];
}

export interface CreateOrderResponse {
  order: Order;
  items: OrderItem[];
  payments: {
    id: string;
    order_id: string;
    payment_method: PaymentMethod;
    amount_cents: number;
    reference_no?: string | null;
    created_at: string;
  }[];
  customer?: Customer | null;
  raw_escpos_bytes?: number[] | null;
}

export interface DashboardMetrics {
  today_sales_cents: number;
  today_orders_count: number;
  low_stock_count: number;
  total_inventory_value_cents: number;
  total_outstanding_credit_cents: number;
  pending_sync_count: number;
}

export interface SyncQueueItem {
  id: string;
  event_type:
    | 'ORDER_CREATED'
    | 'STOCK_ADJUSTED'
    | 'CUSTOMER_PAYMENT'
    | 'STOCK_RECEIVED'
    | 'STOCK_TRANSFER_DISPATCHED'
    | 'STOCK_TRANSFER_ACCEPTED';
  payload: string;
  status: 'PENDING' | 'PROCESSING' | 'SYNCED' | 'FAILED';
  retry_count: number;
  created_at: string;
}

// Master Cosmetics Catalog Definition
export interface MasterCatalogVariant {
  sku: string;
  barcode: string;
  shade_name?: string | null;
  shade_code?: string | null;
  size_volume?: string | null;
  default_cost_cents: number;
  suggested_retail_cents: number;
  initial_stock: number;
}

export interface MasterCatalogProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  image_url: string;
  variants: MasterCatalogVariant[];
}

// Stock Adjustment Reasons & Dual-Approval Request
export type StockAdjustmentReason =
  | 'DAMAGED_TESTER'
  | 'EXPIRED'
  | 'AUDIT_DISCREPANCY'
  | 'RESTOCK_SHIPMENT'
  | 'THEFT_LOSS'
  | 'SUPPLIER_RETURN'
  | 'OTHER';

export interface StockAdjustmentRequest {
  id: string;
  variant_id: string;
  product_name: string;
  brand: string;
  shade_name?: string | null;
  sku: string;
  barcode: string;
  previous_quantity: number;
  new_quantity: number;
  quantity_delta: number;
  reason: StockAdjustmentReason;
  notes?: string | null;
  requested_by: string;
  requested_at: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
}

// Unit of Measure (UOM) Configuration
export interface UOMOption {
  id: string;
  label: string;
  multiplier: number; // e.g. Box of 12 has multiplier 12
  description: string;
}

// CSV / Excel Ingestion Row
export interface CsvImportProductRow {
  product_name: string;
  brand: string;
  category: string;
  shade_name?: string;
  shade_code?: string;
  size_volume?: string;
  sku: string;
  barcode: string;
  cost_price_cents: number;
  selling_price_cents: number;
  quantity_on_hand: number;
  batch_number?: string;
  expiry_date?: string;
  image_url?: string;
}

