use crate::models::*;
use chrono::Utc;
use rusqlite::{params, Connection, Result};
use uuid::Uuid;

pub struct Repository;

impl Repository {
    pub fn get_variants_detailed(conn: &Connection, branch_id: &str) -> Result<Vec<VariantDetail>> {
        let mut stmt = conn.prepare(
            "SELECT v.id, v.product_id, p.name, p.brand, p.category, v.sku, v.barcode,
                    v.shade_name, v.shade_code, v.size_volume, v.cost_price_cents,
                    v.selling_price_cents, v.expiry_date, v.batch_number,
                    v.low_stock_threshold, COALESCE(i.quantity_on_hand, 0)
             FROM product_variants v
             JOIN products p ON p.id = v.product_id
             LEFT JOIN inventory_levels i ON i.variant_id = v.id AND i.branch_id = ?1
             ORDER BY p.brand ASC, p.name ASC, v.shade_name ASC",
        )?;

        let rows = stmt.query_map(params![branch_id], |row| {
            Ok(VariantDetail {
                id: row.get(0)?,
                product_id: row.get(1)?,
                product_name: row.get(2)?,
                brand: row.get(3)?,
                category: row.get(4)?,
                sku: row.get(5)?,
                barcode: row.get(6)?,
                shade_name: row.get(7)?,
                shade_code: row.get(8)?,
                size_volume: row.get(9)?,
                cost_price_cents: row.get(10)?,
                selling_price_cents: row.get(11)?,
                expiry_date: row.get(12)?,
                batch_number: row.get(13)?,
                low_stock_threshold: row.get(14)?,
                quantity_on_hand: row.get(15)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn search_variants(conn: &Connection, query: &str, branch_id: &str) -> Result<Vec<VariantDetail>> {
        let pattern = format!("%{}%", query.trim());
        let mut stmt = conn.prepare(
            "SELECT v.id, v.product_id, p.name, p.brand, p.category, v.sku, v.barcode,
                    v.shade_name, v.shade_code, v.size_volume, v.cost_price_cents,
                    v.selling_price_cents, v.expiry_date, v.batch_number,
                    v.low_stock_threshold, COALESCE(i.quantity_on_hand, 0)
             FROM product_variants v
             JOIN products p ON p.id = v.product_id
             LEFT JOIN inventory_levels i ON i.variant_id = v.id AND i.branch_id = ?1
             WHERE v.barcode LIKE ?2
                OR v.sku LIKE ?2
                OR p.name LIKE ?2
                OR p.brand LIKE ?2
                OR p.category LIKE ?2
                OR v.shade_name LIKE ?2
             ORDER BY p.brand ASC, p.name ASC
             LIMIT 50",
        )?;

        let rows = stmt.query_map(params![branch_id, pattern], |row| {
            Ok(VariantDetail {
                id: row.get(0)?,
                product_id: row.get(1)?,
                product_name: row.get(2)?,
                brand: row.get(3)?,
                category: row.get(4)?,
                sku: row.get(5)?,
                barcode: row.get(6)?,
                shade_name: row.get(7)?,
                shade_code: row.get(8)?,
                size_volume: row.get(9)?,
                cost_price_cents: row.get(10)?,
                selling_price_cents: row.get(11)?,
                expiry_date: row.get(12)?,
                batch_number: row.get(13)?,
                low_stock_threshold: row.get(14)?,
                quantity_on_hand: row.get(15)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn get_variant_by_barcode(conn: &Connection, barcode: &str, branch_id: &str) -> Result<Option<VariantDetail>> {
        let mut stmt = conn.prepare(
            "SELECT v.id, v.product_id, p.name, p.brand, p.category, v.sku, v.barcode,
                    v.shade_name, v.shade_code, v.size_volume, v.cost_price_cents,
                    v.selling_price_cents, v.expiry_date, v.batch_number,
                    v.low_stock_threshold, COALESCE(i.quantity_on_hand, 0)
             FROM product_variants v
             JOIN products p ON p.id = v.product_id
             LEFT JOIN inventory_levels i ON i.variant_id = v.id AND i.branch_id = ?1
             WHERE v.barcode = ?2
             LIMIT 1",
        )?;

        let mut rows = stmt.query_map(params![branch_id, barcode.trim()], |row| {
            Ok(VariantDetail {
                id: row.get(0)?,
                product_id: row.get(1)?,
                product_name: row.get(2)?,
                brand: row.get(3)?,
                category: row.get(4)?,
                sku: row.get(5)?,
                barcode: row.get(6)?,
                shade_name: row.get(7)?,
                shade_code: row.get(8)?,
                size_volume: row.get(9)?,
                cost_price_cents: row.get(10)?,
                selling_price_cents: row.get(11)?,
                expiry_date: row.get(12)?,
                batch_number: row.get(13)?,
                low_stock_threshold: row.get(14)?,
                quantity_on_hand: row.get(15)?,
            })
        })?;

        if let Some(res) = rows.next() {
            Ok(Some(res?))
        } else {
            Ok(None)
        }
    }

    pub fn get_customers(conn: &Connection) -> Result<Vec<Customer>> {
        let mut stmt = conn.prepare(
            "SELECT id, full_name, phone, email, credit_limit_cents, outstanding_balance_cents, notes, created_at
             FROM customers
             ORDER BY full_name ASC",
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(Customer {
                id: row.get(0)?,
                full_name: row.get(1)?,
                phone: row.get(2)?,
                email: row.get(3)?,
                credit_limit_cents: row.get(4)?,
                outstanding_balance_cents: row.get(5)?,
                notes: row.get(6)?,
                created_at: row.get(7)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn get_customer_ledger(conn: &Connection, customer_id: &str) -> Result<Vec<CustomerLedger>> {
        let mut stmt = conn.prepare(
            "SELECT id, customer_id, order_id, transaction_type, amount_cents, balance_after_cents, recorded_by, created_at
             FROM customer_ledger
             WHERE customer_id = ?1
             ORDER BY created_at DESC",
        )?;

        let rows = stmt.query_map(params![customer_id], |row| {
            Ok(CustomerLedger {
                id: row.get(0)?,
                customer_id: row.get(1)?,
                order_id: row.get(2)?,
                transaction_type: row.get(3)?,
                amount_cents: row.get(4)?,
                balance_after_cents: row.get(5)?,
                recorded_by: row.get(6)?,
                created_at: row.get(7)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn create_customer(
        conn: &Connection,
        full_name: &str,
        phone: &str,
        email: Option<&str>,
        credit_limit_cents: i64,
        notes: Option<&str>,
    ) -> Result<Customer> {
        let id = format!("cust_{}", Uuid::new_v4().simple());
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "INSERT INTO customers (id, full_name, phone, email, credit_limit_cents, outstanding_balance_cents, notes, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, 0, ?6, ?7)",
            params![id, full_name, phone, email, credit_limit_cents, notes, now],
        )?;

        Ok(Customer {
            id,
            full_name: full_name.to_string(),
            phone: phone.to_string(),
            email: email.map(String::from),
            credit_limit_cents,
            outstanding_balance_cents: 0,
            notes: notes.map(String::from),
            created_at: now,
        })
    }

    /// Atomic POS Order Checkout Transaction
    pub fn create_order_transaction(
        conn: &mut Connection,
        req: &CreateOrderRequest,
    ) -> Result<CreateOrderResponse> {
        let tx = conn.transaction()?;
        let now = Utc::now().to_rfc3339();
        let order_id = format!("ord_{}", Uuid::new_v4().simple());

        // Calculate total payments and determine status
        let total_paid_cents: i64 = req.payments.iter().map(|p| p.amount_cents).sum();
        let has_credit_payment = req.payments.iter().any(|p| p.payment_method == "CREDIT");

        let payment_status = if has_credit_payment {
            "CREDIT".to_string()
        } else if total_paid_cents >= req.total_cents {
            "PAID".to_string()
        } else {
            "PARTIAL".to_string()
        };

        // 1. Insert Order
        tx.execute(
            "INSERT INTO orders (id, branch_id, register_id, cashier_id, customer_id, subtotal_cents, discount_cents, tax_cents, total_cents, payment_status, sync_status, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 'PENDING', ?11)",
            params![
                order_id,
                req.branch_id,
                req.register_id,
                req.cashier_id,
                req.customer_id,
                req.subtotal_cents,
                req.discount_cents,
                req.tax_cents,
                req.total_cents,
                payment_status,
                now
            ],
        )?;

        // 2. Insert Order Items & Deduct Inventory
        let mut created_items = Vec::new();
        for item in &req.items {
            let item_id = format!("item_{}", Uuid::new_v4().simple());
            tx.execute(
                "INSERT INTO order_items (id, order_id, variant_id, quantity, unit_price_cents, unit_cost_cents, discount_cents, total_cents)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![
                    item_id,
                    order_id,
                    item.variant_id,
                    item.quantity,
                    item.unit_price_cents,
                    item.unit_cost_cents,
                    item.discount_cents,
                    item.total_cents
                ],
            )?;

            // Decrement branch inventory
            tx.execute(
                "UPDATE inventory_levels
                 SET quantity_on_hand = quantity_on_hand - ?1, updated_at = ?2
                 WHERE variant_id = ?3 AND branch_id = ?4",
                params![item.quantity, now, item.variant_id, req.branch_id],
            )?;

            // Query item display info
            let mut variant_stmt = tx.prepare(
                "SELECT p.name, p.brand, v.shade_name, v.size_volume, v.sku
                 FROM product_variants v
                 JOIN products p ON p.id = v.product_id
                 WHERE v.id = ?1",
            )?;

            let (pname, brand, shade, size, sku) = variant_stmt
                .query_row(params![item.variant_id], |row| {
                    Ok((
                        row.get::<_, String>(0)?,
                        row.get::<_, String>(1)?,
                        row.get::<_, Option<String>>(2)?,
                        row.get::<_, Option<String>>(3)?,
                        row.get::<_, String>(4)?,
                    ))
                })
                .unwrap_or_default();

            created_items.push(OrderItem {
                id: item_id,
                order_id: order_id.clone(),
                variant_id: item.variant_id.clone(),
                quantity: item.quantity,
                unit_price_cents: item.unit_price_cents,
                unit_cost_cents: item.unit_cost_cents,
                discount_cents: item.discount_cents,
                total_cents: item.total_cents,
                product_name: Some(pname),
                brand: Some(brand),
                shade_name: shade,
                size_volume: size,
                sku: Some(sku),
            });
        }

        // 3. Insert Payments
        let mut created_payments = Vec::new();
        let mut credit_amount_cents = 0i64;

        for p in &req.payments {
            let payment_id = format!("pay_{}", Uuid::new_v4().simple());
            tx.execute(
                "INSERT INTO payments (id, order_id, payment_method, amount_cents, reference_no, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![
                    payment_id,
                    order_id,
                    p.payment_method,
                    p.amount_cents,
                    p.reference_no,
                    now
                ],
            )?;

            if p.payment_method == "CREDIT" {
                credit_amount_cents += p.amount_cents;
            }

            created_payments.push(Payment {
                id: payment_id,
                order_id: order_id.clone(),
                payment_method: p.payment_method.clone(),
                amount_cents: p.amount_cents,
                reference_no: p.reference_no.clone(),
                created_at: now.clone(),
            });
        }

        // 4. Handle Customer Credit Ledger update
        let mut updated_customer = None;
        if credit_amount_cents > 0 {
            if let Some(ref cust_id) = req.customer_id {
                let current_balance: i64 = tx.query_row(
                    "SELECT outstanding_balance_cents FROM customers WHERE id = ?1",
                    params![cust_id],
                    |row| row.get(0),
                )?;

                let new_balance = current_balance + credit_amount_cents;
                tx.execute(
                    "UPDATE customers SET outstanding_balance_cents = ?1 WHERE id = ?2",
                    params![new_balance, cust_id],
                )?;

                let ledger_id = format!("led_{}", Uuid::new_v4().simple());
                tx.execute(
                    "INSERT INTO customer_ledger (id, customer_id, order_id, transaction_type, amount_cents, balance_after_cents, recorded_by, created_at)
                     VALUES (?1, ?2, ?3, 'DEBIT_SALE', ?4, ?5, ?6, ?7)",
                    params![ledger_id, cust_id, order_id, credit_amount_cents, new_balance, req.cashier_id, now],
                )?;

                // Fetch full customer updated state
                let cust = tx.query_row(
                    "SELECT id, full_name, phone, email, credit_limit_cents, outstanding_balance_cents, notes, created_at FROM customers WHERE id = ?1",
                    params![cust_id],
                    |row| {
                        Ok(Customer {
                            id: row.get(0)?,
                            full_name: row.get(1)?,
                            phone: row.get(2)?,
                            email: row.get(3)?,
                            credit_limit_cents: row.get(4)?,
                            outstanding_balance_cents: row.get(5)?,
                            notes: row.get(6)?,
                            created_at: row.get(7)?,
                        })
                    },
                )?;
                updated_customer = Some(cust);
            }
        }

        // 5. Append to Sync Queue
        let sync_id = format!("sync_{}", Uuid::new_v4().simple());
        let sync_payload = serde_json::to_string(&serde_json::json!({
            "order_id": order_id,
            "branch_id": req.branch_id,
            "total_cents": req.total_cents,
            "items_count": req.items.len(),
            "customer_id": req.customer_id,
            "payments": req.payments,
            "created_at": now
        }))
        .unwrap_or_default();

        tx.execute(
            "INSERT INTO sync_queue (id, event_type, payload, status, retry_count, created_at)
             VALUES (?1, 'ORDER_CREATED', ?2, 'PENDING', 0, ?3)",
            params![sync_id, sync_payload, now],
        )?;

        // Commit transaction
        tx.commit()?;

        let created_order = Order {
            id: order_id,
            branch_id: req.branch_id.clone(),
            register_id: req.register_id.clone(),
            cashier_id: req.cashier_id.clone(),
            customer_id: req.customer_id.clone(),
            subtotal_cents: req.subtotal_cents,
            discount_cents: req.discount_cents,
            tax_cents: req.tax_cents,
            total_cents: req.total_cents,
            payment_status,
            sync_status: "PENDING".to_string(),
            created_at: now,
        };

        Ok(CreateOrderResponse {
            order: created_order,
            items: created_items,
            payments: created_payments,
            customer: updated_customer,
            raw_escpos_bytes: None,
        })
    }

    /// Record customer payment towards their debt
    pub fn record_customer_payment(
        conn: &mut Connection,
        customer_id: &str,
        amount_cents: i64,
        recorded_by: &str,
        _ref_no: Option<&str>,
    ) -> Result<Customer> {
        let tx = conn.transaction()?;
        let now = Utc::now().to_rfc3339();

        let current_balance: i64 = tx.query_row(
            "SELECT outstanding_balance_cents FROM customers WHERE id = ?1",
            params![customer_id],
            |row| row.get(0),
        )?;

        let new_balance = (current_balance - amount_cents).max(0);
        tx.execute(
            "UPDATE customers SET outstanding_balance_cents = ?1 WHERE id = ?2",
            params![new_balance, customer_id],
        )?;

        let ledger_id = format!("led_pay_{}", Uuid::new_v4().simple());
        tx.execute(
            "INSERT INTO customer_ledger (id, customer_id, order_id, transaction_type, amount_cents, balance_after_cents, recorded_by, created_at)
             VALUES (?1, ?2, NULL, 'CREDIT_PAYMENT', ?3, ?4, ?5, ?6)",
            params![ledger_id, customer_id, amount_cents, new_balance, recorded_by, now],
        )?;

        // Append to sync queue
        let sync_id = format!("sync_pay_{}", Uuid::new_v4().simple());
        let sync_payload = serde_json::to_string(&serde_json::json!({
            "customer_id": customer_id,
            "amount_cents": amount_cents,
            "balance_after_cents": new_balance,
            "recorded_by": recorded_by,
            "created_at": now
        }))
        .unwrap_or_default();

        tx.execute(
            "INSERT INTO sync_queue (id, event_type, payload, status, retry_count, created_at)
             VALUES (?1, 'CUSTOMER_PAYMENT', ?2, 'PENDING', 0, ?3)",
            params![sync_id, sync_payload, now],
        )?;

        tx.commit()?;

        let cust = conn.query_row(
            "SELECT id, full_name, phone, email, credit_limit_cents, outstanding_balance_cents, notes, created_at FROM customers WHERE id = ?1",
            params![customer_id],
            |row| {
                Ok(Customer {
                    id: row.get(0)?,
                    full_name: row.get(1)?,
                    phone: row.get(2)?,
                    email: row.get(3)?,
                    credit_limit_cents: row.get(4)?,
                    outstanding_balance_cents: row.get(5)?,
                    notes: row.get(6)?,
                    created_at: row.get(7)?,
                })
            },
        )?;

        Ok(cust)
    }

    pub fn get_orders(conn: &Connection, limit: i64) -> Result<Vec<Order>> {
        let mut stmt = conn.prepare(
            "SELECT id, branch_id, register_id, cashier_id, customer_id, subtotal_cents, discount_cents, tax_cents, total_cents, payment_status, sync_status, created_at
             FROM orders
             ORDER BY created_at DESC
             LIMIT ?1",
        )?;

        let rows = stmt.query_map(params![limit], |row| {
            Ok(Order {
                id: row.get(0)?,
                branch_id: row.get(1)?,
                register_id: row.get(2)?,
                cashier_id: row.get(3)?,
                customer_id: row.get(4)?,
                subtotal_cents: row.get(5)?,
                discount_cents: row.get(6)?,
                tax_cents: row.get(7)?,
                total_cents: row.get(8)?,
                payment_status: row.get(9)?,
                sync_status: row.get(10)?,
                created_at: row.get(11)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn get_dashboard_metrics(conn: &Connection, branch_id: &str) -> Result<DashboardMetrics> {
        let today = Utc::now().format("%Y-%m-%d").to_string();
        let today_prefix = format!("{}%", today);

        let (sales, count): (i64, i64) = conn
            .query_row(
                "SELECT COALESCE(SUM(total_cents), 0), COUNT(*)
                 FROM orders
                 WHERE branch_id = ?1 AND created_at LIKE ?2",
                params![branch_id, today_prefix],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .unwrap_or((0, 0));

        let low_stock: i64 = conn
            .query_row(
                "SELECT COUNT(*)
                 FROM product_variants v
                 LEFT JOIN inventory_levels i ON i.variant_id = v.id AND i.branch_id = ?1
                 WHERE COALESCE(i.quantity_on_hand, 0) <= v.low_stock_threshold",
                params![branch_id],
                |row| row.get(0),
            )
            .unwrap_or(0);

        let inv_value: i64 = conn
            .query_row(
                "SELECT COALESCE(SUM(v.cost_price_cents * COALESCE(i.quantity_on_hand, 0)), 0)
                 FROM product_variants v
                 LEFT JOIN inventory_levels i ON i.variant_id = v.id AND i.branch_id = ?1",
                params![branch_id],
                |row| row.get(0),
            )
            .unwrap_or(0);

        let out_credit: i64 = conn
            .query_row(
                "SELECT COALESCE(SUM(outstanding_balance_cents), 0) FROM customers",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);

        let pending_sync: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sync_queue WHERE status = 'PENDING'",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);

        Ok(DashboardMetrics {
            today_sales_cents: sales,
            today_orders_count: count,
            low_stock_count: low_stock,
            total_inventory_value_cents: inv_value,
            total_outstanding_credit_cents: out_credit,
            pending_sync_count: pending_sync,
        })
    }

    pub fn get_sync_queue(conn: &Connection) -> Result<Vec<SyncQueue>> {
        let mut stmt = conn.prepare(
            "SELECT id, event_type, payload, status, retry_count, created_at
             FROM sync_queue
             ORDER BY created_at ASC
             LIMIT 100",
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(SyncQueue {
                id: row.get(0)?,
                event_type: row.get(1)?,
                payload: row.get(2)?,
                status: row.get(3)?,
                retry_count: row.get(4)?,
                created_at: row.get(5)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }
}
