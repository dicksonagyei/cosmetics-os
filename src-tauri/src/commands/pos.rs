use crate::commands::escpos::generate_order_receipt_bytes;
use crate::db::repository::Repository;
use crate::db::DbState;
use crate::models::{CreateOrderRequest, CreateOrderResponse, Order, VariantDetail};
use tauri::State;

#[tauri::command]
pub fn get_variants(state: State<'_, DbState>) -> Result<Vec<VariantDetail>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    Repository::get_variants_detailed(&conn, &state.branch_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn search_variants(query: String, state: State<'_, DbState>) -> Result<Vec<VariantDetail>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    Repository::search_variants(&conn, &query, &state.branch_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_variant_by_barcode(
    barcode: String,
    state: State<'_, DbState>,
) -> Result<Option<VariantDetail>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    Repository::get_variant_by_barcode(&conn, &barcode, &state.branch_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_order(
    req: CreateOrderRequest,
    state: State<'_, DbState>,
) -> Result<CreateOrderResponse, String> {
    let mut conn = state.conn.lock().map_err(|e| e.to_string())?;
    let mut resp = Repository::create_order_transaction(&mut conn, &req).map_err(|e| e.to_string())?;

    // Generate ESC/POS receipt bytes
    let esc_bytes = generate_order_receipt_bytes(
        "COSMETICS OS BEAUTY STORE",
        "Main Mall Branch #01",
        "+233 (0) 302 123 456",
        &resp.order,
        &resp.items,
        &resp.payments,
        resp.customer.as_ref(),
        true, // kick drawer
    );

    resp.raw_escpos_bytes = Some(esc_bytes);
    Ok(resp)
}

#[tauri::command]
pub fn get_orders(limit: Option<i64>, state: State<'_, DbState>) -> Result<Vec<Order>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let lim = limit.unwrap_or(50);
    Repository::get_orders(&conn, lim).map_err(|e| e.to_string())
}
