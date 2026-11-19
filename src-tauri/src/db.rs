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

fn column_exists(conn: &Connection, table: &str, column: &str) -> Result<bool, String> {
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM pragma_table_info(?1) WHERE name = ?2",
            params![table, column],
            |row| row.get(0),
        )
        .map_err(|e| format!("could not inspect {table}.{column}: {e}"))?;
    Ok(count > 0)
}

/// ALTER TABLE ADD COLUMN, skipped when the column already exists.
/// `table`, `column` and `declaration` are internal constants, never user input.
fn add_column_if_missing(
    conn: &Connection,
    table: &str,
    column: &str,
    declaration: &str,
) -> Result<(), String> {
    if !column_exists(conn, table, column)? {
        conn.execute(
            &format!("ALTER TABLE {table} ADD COLUMN {column} {declaration}"),
            [],
        )
        .map_err(|e| format!("could not add {column} column to {table}: {e}"))?;
    }
    Ok(())
}

/// The legacy (v0.3) `versions` table stored `file_path TEXT NOT NULL` instead of
/// `content`. A plain ADD COLUMN is not enough: the old NOT NULL `file_path`
/// would reject every new insert. Rebuild the table with the current schema,
/// recovering each old version's HTML from its file where possible.
fn rebuild_legacy_versions(app: &AppHandle, conn: &Connection) -> Result<(), String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("could not resolve app data directory: {e}"))?;

    conn.execute_batch("BEGIN;")
        .map_err(|e| format!("could not begin versions migration: {e}"))?;

    let result = (|| -> Result<(), String> {
        conn.execute(
            "CREATE TABLE versions_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                created_at INTEGER NOT NULL
            );",
            [],
        )
        .map_err(|e| format!("could not create versions_new: {e}"))?;

        let mut stmt = conn
            .prepare("SELECT id, page_id, file_path, created_at FROM versions")
            .map_err(|e| format!("could not read legacy versions: {e}"))?;
        let rows: Vec<(i64, String, String, i64)> = stmt
            .query_map([], |row| {
                Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?))
            })
            .map_err(|e| format!("could not query legacy versions: {e}"))?
            .filter_map(Result::ok)
            .collect();

        for (id, page_id, file_path, created_at) in rows {
            let content = fs::read_to_string(&file_path)
                .or_else(|_| fs::read_to_string(data_dir.join(&file_path)))
                .unwrap_or_default();
            conn.execute(
                "INSERT INTO versions_new (id, page_id, content, created_at) VALUES (?1, ?2, ?3, ?4)",
                params![id, page_id, content, created_at],
            )
            .map_err(|e| format!("could not copy legacy version {id}: {e}"))?;
        }

        conn.execute("DROP TABLE versions", [])
            .map_err(|e| format!("could not drop legacy versions: {e}"))?;
        conn.execute("ALTER TABLE versions_new RENAME TO versions", [])
            .map_err(|e| format!("could not rename versions_new: {e}"))?;
        Ok(())
    })();

    match result {
        Ok(()) => {
            conn.execute_batch("COMMIT;")
                .map_err(|e| format!("could not commit versions migration: {e}"))?;
            Ok(())
        }
        Err(e) => {
            let _ = conn.execute_batch("ROLLBACK;");
            Err(e)
        }
    }
}

/// Repair pages whose version row was never written (e.g. saves that failed
/// halfway on the old schema): give every non-empty page an initial version,
/// and point `current_version_id` at the newest version when it is unset.
fn repair_page_versions(conn: &Connection) -> Result<(), String> {
    conn.execute(
        "INSERT INTO versions (page_id, content, created_at)
         SELECT p.id, p.content, p.created_at
         FROM pages p
         WHERE p.content <> ''
           AND NOT EXISTS (SELECT 1 FROM versions v WHERE v.page_id = p.id)",
        [],
    )
    .map_err(|e| format!("could not create missing initial versions: {e}"))?;

    conn.execute(
        "UPDATE pages
         SET current_version_id = (
             SELECT v.id FROM versions v
             WHERE v.page_id = pages.id
             ORDER BY v.created_at DESC, v.id DESC
             LIMIT 1
         )
         WHERE current_version_id IS NULL",
        [],
    )
    .map_err(|e| format!("could not set current_version_id: {e}"))?;
    Ok(())
}

pub fn init_db(app: &AppHandle) -> Result<Connection, String> {
    let path = db_path(app)?;
    let conn = Connection::open(&path).map_err(|e| format!("could not open database: {e}"))?;

    conn.execute("PRAGMA foreign_keys = ON;", [])
        .map_err(|e| format!("could not enable foreign keys: {e}"))?;

    // 1. Create every table with the CURRENT schema first. On existing databases
    //    these are no-ops; the migrations below bring old tables up to date.
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
            content TEXT NOT NULL DEFAULT '',
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

    // 2. Column migrations for databases created by older versions.
    add_column_if_missing(&conn, "pages", "content", "TEXT NOT NULL DEFAULT ''")?;

    if !column_exists(&conn, "versions", "content")? {
        rebuild_legacy_versions(app, &conn)?;
    }

    add_column_if_missing(
        &conn,
        "pages",
        "current_version_id",
        "INTEGER REFERENCES versions(id) ON DELETE SET NULL",
    )?;

    // 3. Backfill pages.content from old pages/<id>/current.html files for pages
    //    with empty content (databases where the content column was just added).
    let empty_content_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM pages WHERE content = '' OR content IS NULL",
            [],
            |row| row.get(0),
        )
        .map_err(|e| format!("could not count empty content pages: {e}"))?;

    if empty_content_count > 0 {
        let old_pages_dir = app
            .path()
            .app_data_dir()
            .map_err(|e| format!("could not resolve app data directory: {e}"))?
            .join("pages");

        if old_pages_dir.exists() {
            let mut stmt = conn
                .prepare("SELECT id FROM pages WHERE content = '' OR content IS NULL")
                .map_err(|e| format!("could not prepare empty content pages: {e}"))?;

            let page_ids: Vec<String> = stmt
                .query_map([], |row| row.get::<_, String>(0))
                .map_err(|e| format!("could not query empty content pages: {e}"))?
                .filter_map(Result::ok)
                .collect();

            for page_id in page_ids {
                let html_path = old_pages_dir.join(&page_id).join("current.html");
                if let Ok(html) = fs::read_to_string(&html_path) {
                    if !html.is_empty() {
                        let _ = conn.execute(
                            "UPDATE pages SET content = ?1 WHERE id = ?2",
                            params![html, page_id],
                        );
                    }
                }
            }
        }
    }

    // 4. Every non-empty page gets a version row and a current_version_id.
    repair_page_versions(&conn)?;

    // 5. Legacy JSON/file-based migration (only when the DB has no pages yet).
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

pub fn rename_collection(app: &AppHandle, id: i64, new_name: &str) -> Result<(), String> {
    let conn = get_conn(app)?;
    conn.execute(
        "UPDATE collections SET name = ?1 WHERE id = ?2",
        params![new_name, id],
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
