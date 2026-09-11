use rusqlite::{Connection, Result};

pub fn init_schema(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        PRAGMA foreign_keys = ON;
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;

        -- Products table
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            brand TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL
        );

        -- Product Variants table (Cosmetics specific)
        CREATE TABLE IF NOT EXISTS product_variants (
            id TEXT PRIMARY KEY,
            product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            sku TEXT UNIQUE NOT NULL,
            barcode TEXT UNIQUE NOT NULL,
            shade_name TEXT,
            shade_code TEXT,
            size_volume TEXT,
            cost_price_cents INTEGER NOT NULL,
            selling_price_cents INTEGER NOT NULL,
            expiry_date TEXT,
            batch_number TEXT,
            low_stock_threshold INTEGER NOT NULL DEFAULT 5
        );

        -- Inventory Levels per branch
        CREATE TABLE IF NOT EXISTS inventory_levels (
            id TEXT PRIMARY KEY,
            variant_id TEXT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
            branch_id TEXT NOT NULL,
            quantity_on_hand INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL,
            UNIQUE(variant_id, branch_id)
        );

        -- Customers table
        CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            full_name TEXT NOT NULL,
            phone TEXT UNIQUE NOT NULL,
            email TEXT,
            credit_limit_cents INTEGER NOT NULL DEFAULT 0,
            outstanding_balance_cents INTEGER NOT NULL DEFAULT 0,
            notes TEXT,
            created_at TEXT NOT NULL
        );

        -- Orders table
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            branch_id TEXT NOT NULL,
            register_id TEXT NOT NULL,
            cashier_id TEXT NOT NULL,
            customer_id TEXT REFERENCES customers(id),
            subtotal_cents INTEGER NOT NULL,
            discount_cents INTEGER NOT NULL DEFAULT 0,
            tax_cents INTEGER NOT NULL DEFAULT 0,
            total_cents INTEGER NOT NULL,
            payment_status TEXT NOT NULL, -- 'PAID', 'PARTIAL', 'CREDIT'
            sync_status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SYNCED'
            created_at TEXT NOT NULL
        );

        -- Order Items table
        CREATE TABLE IF NOT EXISTS order_items (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            variant_id TEXT NOT NULL REFERENCES product_variants(id),
            quantity INTEGER NOT NULL,
            unit_price_cents INTEGER NOT NULL,
            unit_cost_cents INTEGER NOT NULL,
            discount_cents INTEGER NOT NULL DEFAULT 0,
            total_cents INTEGER NOT NULL
        );

        -- Payments table
        CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            payment_method TEXT NOT NULL, -- 'CASH', 'MOMO', 'CARD', 'CREDIT'
            amount_cents INTEGER NOT NULL,
            reference_no TEXT,
            created_at TEXT NOT NULL
        );

        -- Customer Credit Ledger table
        CREATE TABLE IF NOT EXISTS customer_ledger (
            id TEXT PRIMARY KEY,
            customer_id TEXT NOT NULL REFERENCES customers(id),
            order_id TEXT REFERENCES orders(id),
            transaction_type TEXT NOT NULL, -- 'DEBIT_SALE', 'CREDIT_PAYMENT'
            amount_cents INTEGER NOT NULL,
            balance_after_cents INTEGER NOT NULL,
            recorded_by TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        -- Append-Only Cloud Sync Queue
        CREATE TABLE IF NOT EXISTS sync_queue (
            id TEXT PRIMARY KEY,
            event_type TEXT NOT NULL, -- 'ORDER_CREATED', 'STOCK_ADJUSTED', 'CUSTOMER_PAYMENT', 'STOCK_RECEIVED'
            payload TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'SYNCED', 'FAILED'
            retry_count INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );

        -- Indexes for high-speed local reads and POS scanning
        CREATE INDEX IF NOT EXISTS idx_variants_barcode ON product_variants(barcode);
        CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);
        CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id);
        CREATE INDEX IF NOT EXISTS idx_inventory_variant_branch ON inventory_levels(variant_id, branch_id);
        CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
        CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
        CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
        CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
        CREATE INDEX IF NOT EXISTS idx_customer_ledger_customer ON customer_ledger(customer_id);
        CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
        "
    )?;

    Ok(())
}
