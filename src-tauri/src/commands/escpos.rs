use crate::models::{Customer, Order, OrderItem, Payment};

pub struct EscPosBuilder {
    bytes: Vec<u8>,
}

impl EscPosBuilder {
    pub fn new() -> Self {
        let mut builder = Self { bytes: Vec::new() };
        builder.init();
        builder
    }

    pub fn init(&mut self) -> &mut Self {
        self.bytes.extend_from_slice(&[0x1B, 0x40]); // ESC @
        self
    }

    pub fn align_center(&mut self) -> &mut Self {
        self.bytes.extend_from_slice(&[0x1B, 0x61, 0x01]); // ESC a 1
        self
    }

    pub fn align_left(&mut self) -> &mut Self {
        self.bytes.extend_from_slice(&[0x1B, 0x61, 0x00]); // ESC a 0
        self
    }

    pub fn align_right(&mut self) -> &mut Self {
        self.bytes.extend_from_slice(&[0x1B, 0x61, 0x02]); // ESC a 2
        self
    }

    pub fn bold(&mut self, on: bool) -> &mut Self {
        self.bytes.extend_from_slice(&[0x1B, 0x45, if on { 0x01 } else { 0x00 }]); // ESC E
        self
    }

    pub fn text_size(&mut self, double_width: bool, double_height: bool) -> &mut Self {
        let mut n = 0u8;
        if double_width {
            n |= 0x20;
        }
        if double_height {
            n |= 0x01;
        }
        self.bytes.extend_from_slice(&[0x1D, 0x21, n]); // GS ! n
        self
    }

    pub fn text(&mut self, text: &str) -> &mut Self {
        self.bytes.extend_from_slice(text.as_bytes());
        self
    }

    pub fn text_ln(&mut self, text: &str) -> &mut Self {
        self.text(text);
        self.feed(1);
        self
    }

    pub fn feed(&mut self, lines: u8) -> &mut Self {
        for _ in 0..lines {
            self.bytes.push(0x0A); // LF
        }
        self
    }

    pub fn divider(&mut self, width: usize) -> &mut Self {
        let line = "-".repeat(width);
        self.text_ln(&line);
        self
    }

    pub fn row_2_col(&mut self, left: &str, right: &str, total_width: usize) -> &mut Self {
        let left_len = left.chars().count();
        let right_len = right.chars().count();
        if left_len + right_len >= total_width {
            self.text_ln(left);
            let spaces = total_width.saturating_sub(right_len);
            let padded_right = format!("{}{}", " ".repeat(spaces), right);
            self.text_ln(&padded_right);
        } else {
            let spaces = total_width - left_len - right_len;
            let line = format!("{}{}{}", left, " ".repeat(spaces), right);
            self.text_ln(&line);
        }
        self
    }

    /// Full Paper Cut: GS V 65 0
    pub fn cut(&mut self) -> &mut Self {
        self.feed(3);
        self.bytes.extend_from_slice(&[0x1D, 0x56, 0x41, 0x00]);
        self
    }

    /// Cash Drawer Kick: ESC p 0 25 250 (pin 2, 50ms ON, 500ms OFF)
    pub fn kick_cash_drawer(&mut self) -> &mut Self {
        self.bytes.extend_from_slice(&[0x1B, 0x70, 0x00, 0x19, 0xFA]);
        self
    }

    pub fn build(self) -> Vec<u8> {
        self.bytes
    }
}

pub fn format_cents(cents: i64) -> String {
    format!("${:.2}", (cents as f64) / 100.0)
}

pub fn generate_order_receipt_bytes(
    store_name: &str,
    branch_name: &str,
    phone: &str,
    order: &Order,
    items: &[OrderItem],
    payments: &[Payment],
    customer: Option<&Customer>,
    kick_drawer: bool,
) -> Vec<u8> {
    let mut b = EscPosBuilder::new();
    let width = 32; // Standard 58mm printer width in 12x24 font (or 42/48 for 80mm)

    if kick_drawer {
        b.kick_cash_drawer();
    }

    // Header
    b.align_center();
    b.bold(true);
    b.text_size(true, true);
    b.text_ln(store_name);
    b.text_size(false, false);
    b.text_ln(branch_name);
    b.text_ln(&format!("Tel: {}", phone));
    b.bold(false);
    b.divider(width);

    // Meta Info
    b.align_left();
    b.row_2_col("RECEIPT #:", &order.id[..order.id.len().min(16)], width);
    b.row_2_col("DATE:", &order.created_at[..order.created_at.len().min(19)], width);
    b.row_2_col("CASHIER:", &order.cashier_id, width);
    b.row_2_col("REGISTER:", &order.register_id, width);

    if let Some(cust) = customer {
        b.row_2_col("CUSTOMER:", &cust.full_name, width);
        b.row_2_col("PHONE:", &cust.phone, width);
    }
    b.divider(width);

    // Item Table Header
    b.bold(true);
    b.row_2_col("ITEM / QTY", "PRICE", width);
    b.bold(false);
    b.divider(width);

    // Items List
    for item in items {
        let name = item.product_name.as_deref().unwrap_or("Item");
        let shade_info = match (&item.shade_name, &item.size_volume) {
            (Some(s), Some(v)) => format!(" ({}, {})", s, v),
            (Some(s), None) => format!(" ({})", s),
            (None, Some(v)) => format!(" ({})", v),
            (None, None) => "".to_string(),
        };

        let full_desc = format!("{}{}", name, shade_info);
        b.text_ln(&full_desc);

        let qty_price = format!("  {}x @ {}", item.quantity, format_cents(item.unit_price_cents));
        let line_total = format_cents(item.total_cents);
        b.row_2_col(&qty_price, &line_total, width);
    }
    b.divider(width);

    // Totals
    b.row_2_col("SUBTOTAL:", &format_cents(order.subtotal_cents), width);
    if order.discount_cents > 0 {
        b.row_2_col("DISCOUNT:", &format!("-{}", format_cents(order.discount_cents)), width);
    }
    if order.tax_cents > 0 {
        b.row_2_col("TAX (15%):", &format_cents(order.tax_cents), width);
    }

    b.bold(true);
    b.text_size(false, true);
    b.row_2_col("TOTAL:", &format_cents(order.total_cents), width);
    b.text_size(false, false);
    b.bold(false);
    b.divider(width);

    // Payments Breakdown
    b.bold(true);
    b.text_ln("PAYMENT METHOD(S):");
    b.bold(false);
    for p in payments {
        let method_str = match p.payment_method.as_str() {
            "CASH" => "Cash Tendered".to_string(),
            "MOMO" => format!("Mobile Money ({})", p.reference_no.as_deref().unwrap_or("")),
            "CARD" => format!("Card ({})", p.reference_no.as_deref().unwrap_or("Auth")),
            "CREDIT" => "Store Credit / Ledger".to_string(),
            _ => p.payment_method.clone(),
        };
        b.row_2_col(&method_str, &format_cents(p.amount_cents), width);
    }

    // If Credit Customer, show credit ledger summary
    if let Some(cust) = customer {
        if cust.outstanding_balance_cents > 0 || order.payment_status == "CREDIT" {
            b.divider(width);
            b.bold(true);
            b.text_ln("CUSTOMER CREDIT ACCOUNT:");
            b.bold(false);
            b.row_2_col("Credit Limit:", &format_cents(cust.credit_limit_cents), width);
            b.row_2_col("Current Balance:", &format_cents(cust.outstanding_balance_cents), width);
            let available = cust.credit_limit_cents - cust.outstanding_balance_cents;
            b.row_2_col("Available Credit:", &format_cents(available.max(0)), width);
        }
    }

    b.divider(width);
    b.align_center();
    b.text_ln("Thank you for your patronage!");
    b.text_ln("Beauty is confidence.");
    b.text_ln("Unopened items returnable in 7 days");
    b.text_ln("with receipt & original seal.");
    b.feed(1);
    b.text_ln("Powered by Cosmetics OS");

    // Full cut
    b.cut();

    b.build()
}
