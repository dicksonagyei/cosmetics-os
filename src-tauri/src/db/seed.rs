use chrono::Utc;
use rusqlite::{params, Connection, Result};

pub fn seed_data_if_empty(conn: &Connection, branch_id: &str) -> Result<()> {
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM products", [], |row| row.get(0))?;
    if count > 0 {
        return Ok(());
    }

    let now = Utc::now().to_rfc3339();

    // 1. Seed Products
    let products = vec![
        (
            "prod_fenty_foundation",
            "Pro Filt'r Soft Matte Longwear Foundation",
            "Fenty Beauty",
            "Foundation",
            "A soft matte, longwear foundation featuring climate-adaptive technology.",
        ),
        (
            "prod_mac_lipstick",
            "Retro Matte Lipstick",
            "M·A·C Cosmetics",
            "Lipstick",
            "Long-wearing lipstick formula with intense colour payoff and a completely matte finish.",
        ),
        (
            "prod_ordinary_niacinamide",
            "Niacinamide 10% + Zinc 1%",
            "The Ordinary",
            "Skincare Serums",
            "High-strength vitamin and mineral blemish formula to reduce blemishes and congestion.",
        ),
        (
            "prod_cerave_cleanser",
            "Hydrating Facial Cleanser",
            "CeraVe",
            "Cleansers",
            "Cleanses, hydrates and helps restore the protective skin barrier with 3 essential ceramides.",
        ),
        (
            "prod_abh_softglam",
            "Soft Glam Eye Shadow Palette",
            "Anastasia Beverly Hills",
            "Eyeshadow",
            "An essential neutral palette with 14 shades ranging from warm and cool mattes to shimmers.",
        ),
        (
            "prod_maybelline_lifter",
            "Lifter Gloss with Hyaluronic Acid",
            "Maybelline New York",
            "Lip Gloss",
            "Lip gloss makeup hydrates and adds glossy shine with high-impact color.",
        ),
        (
            "prod_baccarat_rouge",
            "Baccarat Rouge 540 Extrait de Parfum",
            "Maison Francis Kurkdjian",
            "Fragrance",
            "Luminous and sophisticated fragrance with woody, amber and floral notes.",
        ),
    ];

    for (id, name, brand, cat, desc) in products {
        conn.execute(
            "INSERT INTO products (id, name, brand, category, description, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![id, name, brand, cat, desc, now],
        )?;
    }

    // 2. Seed Variants
    // (id, product_id, sku, barcode, shade_name, shade_code, size_volume, cost_cents, price_cents, expiry, batch, low_stock, stock_qty)
    let variants = vec![
        // Fenty Foundation Shades
        (
            "var_fenty_420",
            "prod_fenty_foundation",
            "FB-PF-420",
            "840000000001",
            Some("Shade #420 (Deep Neutral)"),
            Some("#5B3B2B"),
            Some("32ml / 1.08 fl oz"),
            1900,
            3800,
            Some("2027-06-30"),
            Some("LOT-FB420-24A"),
            5,
            24,
        ),
        (
            "var_fenty_330",
            "prod_fenty_foundation",
            "FB-PF-330",
            "840000000002",
            Some("Shade #330 (Tan Warm)"),
            Some("#A26B47"),
            Some("32ml / 1.08 fl oz"),
            1900,
            3800,
            Some("2027-06-30"),
            Some("LOT-FB330-24A"),
            5,
            18,
        ),
        (
            "var_fenty_210",
            "prod_fenty_foundation",
            "FB-PF-210",
            "840000000003",
            Some("Shade #210 (Medium Neutral)"),
            Some("#C48F68"),
            Some("32ml / 1.08 fl oz"),
            1900,
            3800,
            Some("2027-05-15"),
            Some("LOT-FB210-24B"),
            5,
            12,
        ),
        (
            "var_fenty_120",
            "prod_fenty_foundation",
            "FB-PF-120",
            "840000000004",
            Some("Shade #120 (Fair Warm)"),
            Some("#E5BCA0"),
            Some("32ml / 1.08 fl oz"),
            1900,
            3800,
            Some("2027-04-10"),
            Some("LOT-FB120-24B"),
            5,
            8,
        ),
        // MAC Lipsticks
        (
            "var_mac_rubywoo",
            "prod_mac_lipstick",
            "MAC-RM-RW",
            "773602000010",
            Some("Ruby Woo (Vivid Blue-Red)"),
            Some("#8D021F"),
            Some("3g / 0.1 oz"),
            1000,
            2200,
            Some("2027-12-31"),
            Some("MAC-RW-2024"),
            5,
            35,
        ),
        (
            "var_mac_velvet_teddy",
            "prod_mac_lipstick",
            "MAC-RM-VT",
            "773602000011",
            Some("Velvet Teddy (Deep Beige)"),
            Some("#965B54"),
            Some("3g / 0.1 oz"),
            1000,
            2200,
            Some("2027-11-30"),
            Some("MAC-VT-2024"),
            5,
            4, // Low stock on purpose
        ),
        (
            "var_mac_whirl",
            "prod_mac_lipstick",
            "MAC-RM-WH",
            "773602000012",
            Some("Whirl (Dirty Rose)"),
            Some("#7E4B48"),
            Some("3g / 0.1 oz"),
            1000,
            2200,
            Some("2027-10-15"),
            Some("MAC-WH-2024"),
            5,
            15,
        ),
        // The Ordinary
        (
            "var_ord_nia_30ml",
            "prod_ordinary_niacinamide",
            "TO-NIA-30ML",
            "769915190011",
            Some("Clear Serum"),
            Some("#E2E8F0"),
            Some("30ml"),
            320,
            650,
            Some("2026-11-30"),
            Some("TO-N30-891"),
            10,
            42,
        ),
        (
            "var_ord_nia_60ml",
            "prod_ordinary_niacinamide",
            "TO-NIA-60ML",
            "769915190012",
            Some("Clear Serum"),
            Some("#E2E8F0"),
            Some("60ml"),
            550,
            1150,
            Some("2026-11-30"),
            Some("TO-N60-892"),
            8,
            20,
        ),
        // CeraVe
        (
            "var_cerave_236ml",
            "prod_cerave_cleanser",
            "CV-HYD-236",
            "333787559718",
            Some("Hydrating Cleanser"),
            Some("#CBD5E1"),
            Some("236ml"),
            800,
            1499,
            Some("2027-08-31"),
            Some("CV-236-09"),
            5,
            16,
        ),
        (
            "var_cerave_473ml",
            "prod_cerave_cleanser",
            "CV-HYD-473",
            "333787559719",
            Some("Hydrating Cleanser"),
            Some("#CBD5E1"),
            Some("473ml"),
            1100,
            1999,
            Some("2027-08-31"),
            Some("CV-473-10"),
            5,
            11,
        ),
        // ABH Eyeshadow
        (
            "var_abh_softglam_std",
            "prod_abh_softglam",
            "ABH-SG-PAL",
            "689304181827",
            Some("14 Neutral Pigments"),
            Some("#D97706"),
            Some("0.74g x 14"),
            2200,
            4500,
            Some("2028-01-01"),
            Some("ABH-SG-01"),
            3,
            7,
        ),
        // Maybelline Lifter Gloss
        (
            "var_mayb_lifter_02",
            "prod_maybelline_lifter",
            "MAYB-LG-02",
            "041554583809",
            Some("002 Ice (Clear Shimmer)"),
            Some("#FCE7F3"),
            Some("5.4ml"),
            450,
            999,
            Some("2027-04-30"),
            Some("MB-LG02-1"),
            5,
            25,
        ),
        (
            "var_mayb_lifter_04",
            "prod_maybelline_lifter",
            "MAYB-LG-04",
            "041554583810",
            Some("004 Silk (Midtone Pink)"),
            Some("#E07A8B"),
            Some("5.4ml"),
            450,
            999,
            Some("2027-04-30"),
            Some("MB-LG04-1"),
            5,
            19,
        ),
        (
            "var_mayb_lifter_08",
            "prod_maybelline_lifter",
            "MAYB-LG-08",
            "041554583811",
            Some("008 Stone (Cool Mauve)"),
            Some("#9B626C"),
            Some("5.4ml"),
            450,
            999,
            Some("2027-04-30"),
            Some("MB-LG08-1"),
            5,
            3, // Low stock
        ),
        // Baccarat Rouge
        (
            "var_mfk_br540_70ml",
            "prod_baccarat_rouge",
            "MFK-BR540-70",
            "370055960001",
            Some("Amber Woody Floral"),
            Some("#F59E0B"),
            Some("70ml Extrait"),
            18000,
            32500,
            Some("2029-12-31"),
            Some("MFK-540-99"),
            2,
            5,
        ),
    ];

    for (
        vid,
        pid,
        sku,
        barcode,
        shade,
        hex,
        vol,
        cost,
        price,
        expiry,
        batch,
        low_thresh,
        qty,
    ) in variants
    {
        conn.execute(
            "INSERT INTO product_variants (id, product_id, sku, barcode, shade_name, shade_code, size_volume, cost_price_cents, selling_price_cents, expiry_date, batch_number, low_stock_threshold)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            params![vid, pid, sku, barcode, shade, hex, vol, cost, price, expiry, batch, low_thresh],
        )?;

        let inv_id = format!("inv_{}_{}", vid, branch_id);
        conn.execute(
            "INSERT INTO inventory_levels (id, variant_id, branch_id, quantity_on_hand, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![inv_id, vid, branch_id, qty, now],
        )?;
    }

    // 3. Seed Customers
    let customers = vec![
        (
            "cust_walkin",
            "Walk-In Customer (Cash/Retail)",
            "+0000000000",
            None,
            0,
            0,
            Some("Default customer for standard cash sales"),
        ),
        (
            "cust_amina",
            "Amina Sow (Glam Studio)",
            "+233501234567",
            Some("amina.sow@glamstudio.com"),
            50000, // $500.00 credit limit
            0,     // $0.00 balance
            Some("VIP Makeup Artist. Approved 30-day credit term."),
        ),
        (
            "cust_kwame",
            "Kwame Mensah (Beauty Bar)",
            "+233249876543",
            Some("kwame@beautybargh.com"),
            100000, // $1000.00 credit limit
            12000,  // $120.00 outstanding balance
            Some("Wholesale reseller. Requires weekly settlement."),
        ),
        (
            "cust_fatima",
            "Fatima Zahra",
            "+233201112233",
            Some("fatima.z@gmail.com"),
            20000, // $200.00 credit limit
            0,
            Some("Frequent regular customer. Loves Fenty & Ordinary."),
        ),
    ];

    for (id, name, phone, email, limit, balance, notes) in customers {
        conn.execute(
            "INSERT INTO customers (id, full_name, phone, email, credit_limit_cents, outstanding_balance_cents, notes, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![id, name, phone, email, limit, balance, notes, now],
        )?;

        // If Kwame has existing balance, seed initial ledger entry
        if balance > 0 {
            let ledger_id = format!("led_init_{}", id);
            conn.execute(
                "INSERT INTO customer_ledger (id, customer_id, order_id, transaction_type, amount_cents, balance_after_cents, recorded_by, created_at)
                 VALUES (?1, ?2, NULL, 'DEBIT_SALE', ?3, ?4, 'SYSTEM_INIT', ?5)",
                params![ledger_id, id, balance, balance, now],
            )?;
        }
    }

    Ok(())
}
