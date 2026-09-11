use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Product {
    pub id: String,
    pub name: String,
    pub brand: String,
    pub category: String,
    pub description: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductVariant {
    pub id: String,
    pub product_id: String,
    pub sku: String,
    pub barcode: String,
    pub shade_name: Option<String>,
    pub shade_code: Option<String>,
    pub size_volume: Option<String>,
    pub cost_price_cents: i64,
    pub selling_price_cents: i64,
    pub expiry_date: Option<String>,
    pub batch_number: Option<String>,
    pub low_stock_threshold: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VariantDetail {
    pub id: String,
    pub product_id: String,
    pub product_name: String,
    pub brand: String,
    pub category: String,
    pub sku: String,
    pub barcode: String,
    pub shade_name: Option<String>,
    pub shade_code: Option<String>,
    pub size_volume: Option<String>,
    pub cost_price_cents: i64,
    pub selling_price_cents: i64,
    pub expiry_date: Option<String>,
    pub batch_number: Option<String>,
    pub low_stock_threshold: i32,
    pub quantity_on_hand: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InventoryLevel {
    pub id: String,
    pub variant_id: String,
    pub branch_id: String,
    pub quantity_on_hand: i32,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Order {
    pub id: String,
    pub branch_id: String,
    pub register_id: String,
    pub cashier_id: String,
    pub customer_id: Option<String>,
    pub subtotal_cents: i64,
    pub discount_cents: i64,
    pub tax_cents: i64,
    pub total_cents: i64,
    pub payment_status: String, // 'PAID', 'PARTIAL', 'CREDIT'
    pub sync_status: String,    // 'PENDING', 'SYNCED'
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderItem {
    pub id: String,
    pub order_id: String,
    pub variant_id: String,
    pub quantity: i32,
    pub unit_price_cents: i64,
    pub unit_cost_cents: i64,
    pub discount_cents: i64,
    pub total_cents: i64,
    // Extra display fields
    pub product_name: Option<String>,
    pub brand: Option<String>,
    pub shade_name: Option<String>,
    pub size_volume: Option<String>,
    pub sku: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Payment {
    pub id: String,
    pub order_id: String,
    pub payment_method: String, // 'CASH', 'MOMO', 'CARD', 'CREDIT'
    pub amount_cents: i64,
    pub reference_no: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Customer {
    pub id: String,
    pub full_name: String,
    pub phone: String,
    pub email: Option<String>,
    pub credit_limit_cents: i64,
    pub outstanding_balance_cents: i64,
    pub notes: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomerLedger {
    pub id: String,
    pub customer_id: String,
    pub order_id: Option<String>,
    pub transaction_type: String, // 'DEBIT_SALE', 'CREDIT_PAYMENT'
    pub amount_cents: i64,
    pub balance_after_cents: i64,
    pub recorded_by: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncQueue {
    pub id: String,
    pub event_type: String, // 'ORDER_CREATED', 'STOCK_ADJUSTED', 'CUSTOMER_PAYMENT', 'STOCK_RECEIVED'
    pub payload: String,
    pub status: String, // 'PENDING', 'PROCESSING', 'SYNCED', 'FAILED'
    pub retry_count: i32,
    pub created_at: String,
}

// Request & Response DTOs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CartItemDto {
    pub variant_id: String,
    pub quantity: i32,
    pub unit_price_cents: i64,
    pub unit_cost_cents: i64,
    pub discount_cents: i64,
    pub total_cents: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentDto {
    pub payment_method: String, // CASH, MOMO, CARD, CREDIT
    pub amount_cents: i64,
    pub reference_no: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateOrderRequest {
    pub branch_id: String,
    pub register_id: String,
    pub cashier_id: String,
    pub customer_id: Option<String>,
    pub subtotal_cents: i64,
    pub discount_cents: i64,
    pub tax_cents: i64,
    pub total_cents: i64,
    pub items: Vec<CartItemDto>,
    pub payments: Vec<PaymentDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateOrderResponse {
    pub order: Order,
    pub items: Vec<OrderItem>,
    pub payments: Vec<Payment>,
    pub customer: Option<Customer>,
    pub raw_escpos_bytes: Option<Vec<u8>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardMetrics {
    pub today_sales_cents: i64,
    pub today_orders_count: i64,
    pub low_stock_count: i64,
    pub total_inventory_value_cents: i64,
    pub total_outstanding_credit_cents: i64,
    pub pending_sync_count: i64,
}
