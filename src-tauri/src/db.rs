//! SQLite database setup and migrations (ARCHITECTURE.md).
//!
//! v0.2 migrates metadata from `meta.json` files into SQLite, while HTML
//! content remains as plain files on disk.

use rusqlite::{params, Connection};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use crate::storage::PageMeta;

fn db_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("could not resolve app data directory: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("could not create app data directory: {e}"))?;
    Ok(dir.join("app.db"))
}

pub fn init_db(app: &AppHandle) -> Result<Connection, String> {
    let path = db_path(app)?;
    let conn = Connection::open(&path).map_err(|e| format!("could not open database: {e}"))?;

    // Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON;", [])
        .map_err(|e| format!("could not enable foreign keys: {e}"))?;

    // Create tables
    conn.execute(
        "CREATE TABLE IF NOT EXISTS collections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            parent_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );",
        [],
    )
    .map_err(|e| format!("could not create collections table: {e}"))?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS pages (
            id TEXT PRIMARY KEY,
            collection_id INTEGER REFERENCES collections(id) ON DELETE SET NULL,
            title TEXT NOT NULL,
            current_version_id INTEGER REFERENCES versions(id) ON DELETE SET NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );",
        [],
    )
    .map_err(|e| format!("could not create pages table: {e}"))?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
            file_path TEXT NOT NULL,
            created_at INTEGER NOT NULL
        );",
        [],
    )
    .map_err(|e| format!("could not create versions table: {e}"))?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        );",
        [],
    )
    .map_err(|e| format!("could not create tags table: {e}"))?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS page_tags (
            page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
            tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
            PRIMARY KEY (page_id, tag_id)
        );",
        [],
    )
    .map_err(|e| format!("could not create page_tags table: {e}"))?;

    // Check if migration is needed (if pages table is empty, migrate from meta.json)
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM pages", [], |row| row.get(0))
        .map_err(|e| format!("could not count pages: {e}"))?;

    if count == 0 {
        migrate_from_json(app, &conn)?;
    }

    Ok(conn)
}

fn migrate_from_json(app: &AppHandle, conn: &Connection) -> Result<(), String> {
    let pages_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("could not resolve app data directory: {e}"))?
        .join("pages");

    if !pages_dir.exists() {
        return Ok(());
    }

    let entries = fs::read_dir(&pages_dir).map_err(|e| format!("could not read pages dir: {e}"))?;

    for entry in entries {
        let Ok(entry) = entry else { continue };
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let meta_path = path.join("meta.json");
        let Ok(data) = fs::read_to_string(&meta_path) else {
            continue;
        };

        let Ok(meta) = serde_json::from_str::<PageMeta>(&data) else {
            continue;
        };

        // Insert into SQLite
        let _ = conn.execute(
            "INSERT INTO pages (id, collection_id, title, created_at, updated_at) VALUES (?1, NULL, ?2, ?3, ?4)",
            params![meta.id, meta.title, meta.created_at, meta.updated_at],
        );
        
        // Create initial version record
        let file_path = format!("{}/current.html", meta.id);
        let _ = conn.execute(
            "INSERT INTO versions (page_id, file_path, created_at) VALUES (?1, ?2, ?3)",
            params![meta.id, file_path, meta.created_at],
        );
        
        // Update page with current_version_id
        let version_id: i64 = conn.last_insert_rowid();
        let _ = conn.execute(
            "UPDATE pages SET current_version_id = ?1 WHERE id = ?2",
            params![version_id, meta.id],
        );
    }

    Ok(())
}

pub fn get_conn(app: &AppHandle) -> Result<Connection, String> {
    init_db(app)
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Collection {
    pub id: i64,
    pub parent_id: Option<i64>,
    pub name: String,
    pub created_at: String,
}

pub fn create_collection(app: &AppHandle, name: &str, parent_id: Option<i64>) -> Result<Collection, String> {
    let conn = get_conn(app)?;
    conn.execute(
        "INSERT INTO collections (parent_id, name) VALUES (?1, ?2)",
        params![parent_id, name],
    )
    .map_err(|e| format!("could not create collection: {e}"))?;

    let id = conn.last_insert_rowid();
    let created_at: String = conn
        .query_row("SELECT created_at FROM collections WHERE id = ?1", params![id], |row| row.get(0))
        .map_err(|e| format!("could not get collection created_at: {e}"))?;

    Ok(Collection {
        id,
        parent_id,
        name: name.to_string(),
        created_at,
    })
}

pub fn list_collections(app: &AppHandle) -> Result<Vec<Collection>, String> {
    let conn = get_conn(app)?;
    let mut stmt = conn
        .prepare("SELECT id, parent_id, name, created_at FROM collections ORDER BY name")
        .map_err(|e| format!("could not prepare list collections: {e}"))?;

    let collections = stmt
        .query_map([], |row| {
            Ok(Collection {
                id: row.get(0)?,
                parent_id: row.get(1)?,
                name: row.get(2)?,
                created_at: row.get(3)?,
            })
        })
        .map_err(|e| format!("could not query collections: {e}"))?
        .filter_map(Result::ok)
        .collect();

    Ok(collections)
}

pub fn rename_collection(app: &AppHandle, id: i64, name: &str) -> Result<(), String> {
    let conn = get_conn(app)?;
    conn.execute(
        "UPDATE collections SET name = ?1 WHERE id = ?2",
        params![name, id],
    )
    .map_err(|e| format!("could not rename collection: {e}"))?;
    Ok(())
}

pub fn move_collection(app: &AppHandle, id: i64, new_parent_id: Option<i64>) -> Result<(), String> {
    let conn = get_conn(app)?;
    conn.execute(
        "UPDATE collections SET parent_id = ?1 WHERE id = ?2",
        params![new_parent_id, id],
    )
    .map_err(|e| format!("could not move collection: {e}"))?;
    Ok(())
}

pub fn delete_collection(app: &AppHandle, id: i64) -> Result<(), String> {
    let conn = get_conn(app)?;
    // ON DELETE CASCADE will handle child collections
    // ON DELETE SET NULL will handle pages in this collection
    conn.execute("DELETE FROM collections WHERE id = ?1", params![id])
        .map_err(|e| format!("could not delete collection: {e}"))?;
    Ok(())
}

pub fn move_page(app: &AppHandle, page_id: &str, collection_id: Option<i64>) -> Result<(), String> {
    let conn = get_conn(app)?;
    conn.execute(
        "UPDATE pages SET collection_id = ?1 WHERE id = ?2",
        params![collection_id, page_id],
    )
    .map_err(|e| format!("could not move page: {e}"))?;
    Ok(())
}

pub fn rename_page(app: &AppHandle, page_id: &str, title: &str) -> Result<(), String> {
    let conn = get_conn(app)?;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64;
        
    conn.execute(
        "UPDATE pages SET title = ?1, updated_at = ?2 WHERE id = ?3",
        params![title, now, page_id],
    )
    .map_err(|e| format!("could not rename page: {e}"))?;
    Ok(())
}
