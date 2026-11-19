//! SQLite database setup and migrations (ARCHITECTURE.md).
//!
//! v0.4 migrates to a directory-styled storage structure:
//! <app-data>/
//!   app.db           # SQLite (metadata, tags, versions)
//!   workspace/       # Actual directory structure
//!     Unsorted/
//!       my-page.html
//!     Projects/
//!       landing.html

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

pub fn workspace_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("could not resolve app data directory: {e}"))?
        .join("workspace");
    fs::create_dir_all(&dir).map_err(|e| format!("could not create workspace directory: {e}"))?;
    Ok(dir)
}

fn slugify(title: &str) -> String {
    title
        .to_lowercase()
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
        .collect::<String>()
        .replace(" ", "-")
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
            rel_path TEXT NOT NULL UNIQUE,
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
            file_name TEXT NOT NULL,
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
            file_name TEXT NOT NULL,
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

    let ws = workspace_dir(app)?;
    let unsorted_dir = ws.join("Unsorted");
    fs::create_dir_all(&unsorted_dir).map_err(|e| format!("could not create Unsorted directory: {e}"))?;

    let entries = fs::read_dir(&old_pages_dir).map_err(|e| format!("could not read old pages dir: {e}"))?;

    #[derive(serde::Deserialize)]
    struct OldPageMeta {
        id: String,
        collection_id: Option<i64>,
        title: String,
        created_at: u64,
        updated_at: u64,
    }

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

        let Ok(meta) = serde_json::from_str::<OldPageMeta>(&data) else {
            continue;
        };

        let html_path = path.join("current.html");
        let Ok(html) = fs::read_to_string(&html_path) else {
            continue;
        };

        let target_dir = if let Some(cid) = meta.collection_id {
            let rel_path: Option<String> = conn
                .query_row("SELECT rel_path FROM collections WHERE id = ?1", rusqlite::params![cid], |row| row.get(0))
                .ok();
            if let Some(rp) = rel_path {
                ws.join(&rp)
            } else {
                unsorted_dir.clone()
            }
        } else {
            unsorted_dir.clone()
        };

        fs::create_dir_all(&target_dir).map_err(|e| format!("could not create target directory: {e}"))?;

        let base_slug = slugify(&meta.title);
        let mut file_name = format!("{}.html", base_slug);
        let mut counter = 1;
        while target_dir.join(&file_name).exists() {
            file_name = format!("{}-{}.html", base_slug, counter);
            counter += 1;
        }

        fs::write(target_dir.join(&file_name), &html)
            .map_err(|e| format!("could not write migrated HTML: {e}"))?;

        conn.execute(
            "INSERT INTO pages (id, collection_id, title, file_name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![meta.id, meta.collection_id, meta.title, file_name, meta.created_at, meta.updated_at],
        ).map_err(|e| format!("could not insert migrated page: {e}"))?;

        let version_file = format!("{}-v{}.html", base_slug, meta.created_at);
        fs::write(target_dir.join(&version_file), &html)
            .map_err(|e| format!("could not write migrated version HTML: {e}"))?;

        conn.execute(
            "INSERT INTO versions (page_id, file_name, created_at) VALUES (?1, ?2, ?3)",
            rusqlite::params![meta.id, version_file, meta.created_at],
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
    pub rel_path: String,
    pub created_at: String,
}

pub fn create_collection(app: &AppHandle, name: &str, parent_id: Option<i64>) -> Result<Collection, String> {
    let conn = get_conn(app)?;
    let slug = slugify(name);
    
    let rel_path = if let Some(pid) = parent_id {
        let parent_path: String = conn.query_row(
            "SELECT rel_path FROM collections WHERE id = ?1",
            rusqlite::params![pid],
            |row| row.get(0)
        ).map_err(|e| format!("could not get parent collection path: {e}"))?;
        format!("{}/{}", parent_path, slug)
    } else {
        slug
    };

    conn.execute(
        "INSERT INTO collections (parent_id, name, rel_path) VALUES (?1, ?2, ?3)",
        params![parent_id, name, rel_path],
    )
    .map_err(|e| format!("could not create collection: {e}"))?;

    let id = conn.last_insert_rowid();
    let created_at: String = conn
        .query_row("SELECT created_at FROM collections WHERE id = ?1", params![id], |row| row.get(0))
        .map_err(|e| format!("could not get collection created_at: {e}"))?;

    let ws = workspace_dir(app)?;
    let dir = ws.join(&rel_path);
    fs::create_dir_all(&dir).map_err(|e| format!("could not create collection directory: {e}"))?;

    Ok(Collection {
        id,
        parent_id,
        name: name.to_string(),
        rel_path,
        created_at,
    })
}

pub fn list_collections(app: &AppHandle) -> Result<Vec<Collection>, String> {
    let conn = get_conn(app)?;
    let mut stmt = conn
        .prepare("SELECT id, parent_id, name, rel_path, created_at FROM collections ORDER BY name")
        .map_err(|e| format!("could not prepare list collections: {e}"))?;

    let collections = stmt
        .query_map([], |row| {
            Ok(Collection {
                id: row.get(0)?,
                parent_id: row.get(1)?,
                name: row.get(2)?,
                rel_path: row.get(3)?,
                created_at: row.get(4)?,
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
    let (file_name, old_collection_id): (String, Option<i64>) = conn.query_row(
        "SELECT file_name, collection_id FROM pages WHERE id = ?1",
        rusqlite::params![page_id],
        |row| Ok((row.get(0)?, row.get(1)?))
    ).map_err(|e| format!("could not get page info: {e}"))?;

    if old_collection_id == new_collection_id {
        return Ok(());
    }

    let old_rel_path: Option<String> = if let Some(cid) = old_collection_id {
        conn.query_row("SELECT rel_path FROM collections WHERE id = ?1", rusqlite::params![cid], |row| row.get(0)).ok()
    } else {
        Some("Unsorted".to_string())
    };

    let new_rel_path: Option<String> = if let Some(cid) = new_collection_id {
        conn.query_row("SELECT rel_path FROM collections WHERE id = ?1", rusqlite::params![cid], |row| row.get(0)).ok()
    } else {
        Some("Unsorted".to_string())
    };

    let ws = workspace_dir(app)?;
    let old_dir = if let Some(rp) = old_rel_path { ws.join(&rp) } else { ws.clone() };
    let new_dir = if let Some(rp) = new_rel_path { ws.join(&rp) } else { ws.clone() };

    fs::create_dir_all(&new_dir).map_err(|e| format!("could not create new collection directory: {e}"))?;

    let old_path = old_dir.join(&file_name);
    let new_path = new_dir.join(&file_name);

    if old_path.exists() {
        fs::rename(&old_path, &new_path).map_err(|e| format!("could not move page file: {e}"))?;
    }

    let mut stmt = conn.prepare("SELECT file_name FROM versions WHERE page_id = ?1")
        .map_err(|e| format!("could not prepare list versions: {e}"))?;
    let version_files: Vec<String> = stmt.query_map(rusqlite::params![page_id], |row| row.get(0))
        .map_err(|e| format!("could not query versions: {e}"))?
        .filter_map(Result::ok)
        .collect();

    for v_file in version_files {
        let v_old_path = old_dir.join(&v_file);
        let v_new_path = new_dir.join(&v_file);
        if v_old_path.exists() {
            fs::rename(&v_old_path, &v_new_path).map_err(|e| format!("could not move version file: {e}"))?;
        }
    }

    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis() as u64;
    conn.execute(
        "UPDATE pages SET collection_id = ?1, updated_at = ?2 WHERE id = ?3",
        rusqlite::params![new_collection_id, now, page_id],
    ).map_err(|e| format!("could not move page in db: {e}"))?;

    Ok(())
}

pub fn rename_page(app: &AppHandle, page_id: &str, new_title: &str) -> Result<(), String> {
    let conn = get_conn(app)?;
    let (old_file_name, collection_id): (String, Option<i64>) = conn.query_row(
        "SELECT file_name, collection_id FROM pages WHERE id = ?1",
        rusqlite::params![page_id],
        |row| Ok((row.get(0)?, row.get(1)?))
    ).map_err(|e| format!("could not get page info: {e}"))?;

    let new_base_slug = slugify(new_title);
    let mut new_file_name = format!("{}.html", new_base_slug);

    let rel_path: Option<String> = if let Some(cid) = collection_id {
        conn.query_row("SELECT rel_path FROM collections WHERE id = ?1", rusqlite::params![cid], |row| row.get(0)).ok()
    } else {
        Some("Unsorted".to_string())
    };

    let ws = workspace_dir(app)?;
    let dir = if let Some(rp) = rel_path { ws.join(&rp) } else { ws.clone() };

    let mut counter = 1;
    while dir.join(&new_file_name).exists() && new_file_name != old_file_name {
        new_file_name = format!("{}-{}.html", new_base_slug, counter);
        counter += 1;
    }

    if new_file_name != old_file_name {
        let old_path = dir.join(&old_file_name);
        let new_path = dir.join(&new_file_name);
        fs::rename(&old_path, &new_path).map_err(|e| format!("could not rename page file: {e}"))?;

        let old_base = old_file_name.trim_end_matches(".html");
        let new_base = new_file_name.trim_end_matches(".html");

        let mut stmt = conn.prepare("SELECT file_name FROM versions WHERE page_id = ?1")
            .map_err(|e| format!("could not prepare list versions: {e}"))?;
        let version_files: Vec<String> = stmt.query_map(rusqlite::params![page_id], |row| row.get(0))
            .map_err(|e| format!("could not query versions: {e}"))?
            .filter_map(Result::ok)
            .collect();

        for v_file in version_files {
            if v_file.starts_with(old_base) {
                let v_new_name = v_file.replace(old_base, new_base);
                let v_old_path = dir.join(&v_file);
                let v_new_path = dir.join(&v_new_name);
                if v_old_path.exists() {
                    fs::rename(&v_old_path, &v_new_path).map_err(|e| format!("could not rename version file: {e}"))?;
                    conn.execute(
                        "UPDATE versions SET file_name = ?1 WHERE file_name = ?2 AND page_id = ?3",
                        rusqlite::params![v_new_name, v_file, page_id],
                    ).map_err(|e| format!("could not update version file name: {e}"))?;
                }
            }
        }
    }

    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis() as u64;
    conn.execute(
        "UPDATE pages SET title = ?1, file_name = ?2, updated_at = ?3 WHERE id = ?4",
        rusqlite::params![new_title, new_file_name, now, page_id],
    ).map_err(|e| format!("could not rename page in db: {e}"))?;

    Ok(())
}