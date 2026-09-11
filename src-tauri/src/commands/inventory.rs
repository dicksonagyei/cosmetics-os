use crate::db::repository::Repository;
use crate::db::DbState;
use crate::models::{DashboardMetrics, SyncQueue};
use tauri::State;

#[tauri::command]
pub fn get_dashboard_metrics(state: State<'_, DbState>) -> Result<DashboardMetrics, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    Repository::get_dashboard_metrics(&conn, &state.branch_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_sync_queue(state: State<'_, DbState>) -> Result<Vec<SyncQueue>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    Repository::get_sync_queue(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn print_raw_escpos(bytes: Vec<u8>) -> Result<bool, String> {
    // In a production hardware setup, this opens the COM port or USB printer endpoint (e.g. via serialport or raw windows spooler)
    println!(">>> ESC/POS Raw Print Command ({} bytes)", bytes.len());
    Ok(true)
}
