pub mod schema;
pub mod seed;
pub mod repository;

use rusqlite::{Connection, Result};
use std::path::Path;
use std::sync::Mutex;

pub struct DbState {
    pub conn: Mutex<Connection>,
    pub branch_id: String,
}

pub fn init_database(db_path: &Path, branch_id: &str) -> Result<Connection> {
    let conn = Connection::open(db_path)?;
    schema::init_schema(&conn)?;
    seed::seed_data_if_empty(&conn, branch_id)?;
    Ok(conn)
}
