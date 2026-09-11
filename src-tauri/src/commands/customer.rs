use crate::db::repository::Repository;
use crate::db::DbState;
use crate::models::{Customer, CustomerLedger};
use tauri::State;

#[tauri::command]
pub fn get_customers(state: State<'_, DbState>) -> Result<Vec<Customer>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    Repository::get_customers(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_customer_ledger(
    customer_id: String,
    state: State<'_, DbState>,
) -> Result<Vec<CustomerLedger>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    Repository::get_customer_ledger(&conn, &customer_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_customer(
    full_name: String,
    phone: String,
    email: Option<String>,
    credit_limit_cents: i64,
    notes: Option<String>,
    state: State<'_, DbState>,
) -> Result<Customer, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    Repository::create_customer(
        &conn,
        &full_name,
        &phone,
        email.as_deref(),
        credit_limit_cents,
        notes.as_deref(),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn record_customer_payment(
    customer_id: String,
    amount_cents: i64,
    recorded_by: String,
    reference_no: Option<String>,
    state: State<'_, DbState>,
) -> Result<Customer, String> {
    let mut conn = state.conn.lock().map_err(|e| e.to_string())?;
    Repository::record_customer_payment(
        &mut conn,
        &customer_id,
        amount_cents,
        &recorded_by,
        reference_no.as_deref(),
    )
    .map_err(|e| e.to_string())
}
