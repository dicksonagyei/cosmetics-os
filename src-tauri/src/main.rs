// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod models;

use db::DbState;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

fn get_database_path() -> PathBuf {
    // In dev or desktop mode, locate database file in user data directory or local app dir
    let mut dir = dirs_next().unwrap_or_else(|| PathBuf::from("."));
    dir.push("CosmeticsOS");
    let _ = fs::create_dir_all(&dir);
    dir.push("cosmetics_edge.sqlite");
    dir
}

fn dirs_next() -> Option<PathBuf> {
    if let Some(appdata) = std::env::var_os("APPDATA") {
        Some(PathBuf::from(appdata))
    } else if let Some(home) = std::env::var_os("HOME") {
        Some(PathBuf::from(home))
    } else {
        None
    }
}

fn main() {
    let branch_id = "branch_accra_mall_01".to_string();
    let db_path = get_database_path();
    println!(">>> Initializing Cosmetics OS Edge SQLite at: {:?}", db_path);

    let conn = match db::init_database(&db_path, &branch_id) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("Failed to initialize database: {}", e);
            // Fallback to in-memory db if disk path has access issues
            let mem_conn = rusqlite::Connection::open_in_memory().expect("In-memory SQLite failed");
            db::schema::init_schema(&mem_conn).expect("Schema init failed");
            db::seed::seed_data_if_empty(&mem_conn, &branch_id).expect("Seed failed");
            mem_conn
        }
    };

    let db_state = DbState {
        conn: Mutex::new(conn),
        branch_id: branch_id.clone(),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(db_state)
        .invoke_handler(tauri::generate_handler![
            commands::pos::get_variants,
            commands::pos::search_variants,
            commands::pos::get_variant_by_barcode,
            commands::pos::create_order,
            commands::pos::get_orders,
            commands::customer::get_customers,
            commands::customer::get_customer_ledger,
            commands::customer::create_customer,
            commands::customer::record_customer_payment,
            commands::inventory::get_dashboard_metrics,
            commands::inventory::get_sync_queue,
            commands::inventory::print_raw_escpos,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Cosmetics OS application");
}
