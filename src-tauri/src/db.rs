//! SQLite database setup and migrations.
//! v0.4 revised: Purely virtual directory structure. All data is stored in SQLite.

use rusqlite::{params, Connection};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

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

    conn.execute("PRAGMA foreign_keys = ON;", [])
        .map_err(|e| format!("could not enable foreign keys: {e}"))?;

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
            content TEXT NOT NULL,
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
            content TEXT NOT NULL,
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

    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM pages", [], |row| row.get(0))
        .map_err(|e| format!("could not count pages: {e}"))?;

    if count == 0 {
        migrate_from_json(app, &conn)?;
    }

    Ok(conn)
}

fn migrate_from_json(app: &AppHandle, conn: &Connection) -> Result<(), String> {
    let old_pages_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("could not resolve app data directory: {e}"))?
        .join("pages");

    if !old_pages_dir.exists() {
        return Ok(());
    }

    #[derive(serde::Deserialize)]
    struct OldPageMeta {
        id: String,
        collection_id: Option<i64>,
        title: String,
        created_at: u64,
        updated_at: u64,
    }

    for entry in fs::read_dir(&old_pages_dir).map_err(|e| format!("could not read old pages dir: {e}"))? {
        let Ok(entry) = entry else { continue };
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let meta_path = path.join("meta.json");
        let Ok(data) = fs::read_to_string(&meta_path) else {
            continue;
        };

        let Ok(meta) = serde_json::from_str::<OldPageMeta>(&data) else {
            continue;
        };

        let html_path = path.join("current.html");
        let Ok(html) = fs::read_to_string(&html_path) else {
            continue;
        };

        conn.execute(
            "INSERT INTO pages (id, collection_id, title, content, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![meta.id, meta.collection_id, meta.title, html, meta.created_at, meta.updated_at],
        ).map_err(|e| format!("could not insert migrated page: {e}"))?;

        conn.execute(
            "INSERT INTO versions (page_id, content, created_at) VALUES (?1, ?2, ?3)",
            rusqlite::params![meta.id, html, meta.created_at],
        ).map_err(|e| format!("could not insert migrated version: {e}"))?;

        let version_id = conn.last_insert_rowid();
        conn.execute(
            "UPDATE pages SET current_version_id = ?1 WHERE id = ?2",
            rusqlite::params![version_id, meta.id],
        ).map_err(|e| format!("could not update migrated page version: {e}"))?;
    }

    let _ = fs::rename(&old_pages_dir, old_pages_dir.with_extension("old"));
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
    conn.execute("DELETE FROM collections WHERE id = ?1", params![id])
        .map_err(|e| format!("could not delete collection: {e}"))?;
    Ok(())
}

pub fn move_page(app: &AppHandle, page_id: &str, new_collection_id: Option<i64>) -> Result<(), String> {
    let conn = get_conn(app)?;
    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis() as u64;
    conn.execute(
        "UPDATE pages SET collection_id = ?1, updated_at = ?2 WHERE id = ?3",
        rusqlite::params![new_collection_id, now, page_id],
    ).map_err(|e| format!("could not move page in db: {e}"))?;
    Ok(())
}

pub fn rename_page(app: &AppHandle, page_id: &str, new_title: &str) -> Result<(), String> {
    let conn = get_conn(app)?;
    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis() as u64;
    conn.execute(
        "UPDATE pages SET title = ?1, updated_at = ?2 WHERE id = ?3",
        rusqlite::params![new_title, now, page_id],
    ).map_err(|e| format!("could not rename page in db: {e}"))?;
    Ok(())
}