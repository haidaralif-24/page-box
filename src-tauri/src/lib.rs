mod cleaning;
mod db;
mod storage;

use db::Collection;
use storage::{PageMeta, Version, Tag};
use tauri::AppHandle;

#[tauri::command]
fn list_pages(app: AppHandle, collection_id: Option<i64>) -> Result<Vec<PageMeta>, String> {
    storage::list_pages(&app, collection_id)
}

#[tauri::command]
fn add_page(app: AppHandle, raw_text: String, collection_id: Option<i64>) -> Result<PageMeta, String> {
    storage::add_page(&app, &raw_text, collection_id)
}

#[tauri::command]
fn get_page_html(app: AppHandle, page_id: String, version_id: Option<i64>) -> Result<String, String> {
    storage::get_page_html(&app, &page_id, version_id)
}

#[tauri::command]
fn delete_page(app: AppHandle, page_id: String) -> Result<(), String> {
    storage::delete_page(&app, &page_id)
}

#[tauri::command]
fn move_page(app: AppHandle, page_id: String, collection_id: Option<i64>) -> Result<(), String> {
    db::move_page(&app, &page_id, collection_id)
}

#[tauri::command]
fn rename_page(app: AppHandle, page_id: String, title: String) -> Result<(), String> {
    db::rename_page(&app, &page_id, &title)
}

#[tauri::command]
fn list_collections(app: AppHandle) -> Result<Vec<Collection>, String> {
    db::list_collections(&app)
}

#[tauri::command]
fn create_collection(app: AppHandle, name: String, parent_id: Option<i64>) -> Result<Collection, String> {
    db::create_collection(&app, &name, parent_id)
}

#[tauri::command]
fn rename_collection(app: AppHandle, id: i64, name: String) -> Result<(), String> {
    db::rename_collection(&app, id, &name)
}

#[tauri::command]
fn move_collection(app: AppHandle, id: i64, new_parent_id: Option<i64>) -> Result<(), String> {
    db::move_collection(&app, id, new_parent_id)
}

#[tauri::command]
fn delete_collection(app: AppHandle, id: i64) -> Result<(), String> {
    db::delete_collection(&app, id)
}

// --- v0.3 Commands ---

#[tauri::command]
fn replace_page(app: AppHandle, page_id: String, raw_text: String) -> Result<PageMeta, String> {
    storage::replace_page(&app, &page_id, &raw_text)
}

#[tauri::command]
fn list_versions(app: AppHandle, page_id: String) -> Result<Vec<Version>, String> {
    storage::list_versions(&app, &page_id)
}

#[tauri::command]
fn restore_version(app: AppHandle, page_id: String, version_id: i64) -> Result<(), String> {
    storage::restore_version(&app, &page_id, version_id)
}

#[tauri::command]
fn add_tag(app: AppHandle, page_id: String, tag_name: String) -> Result<(), String> {
    storage::add_tag(&app, &page_id, &tag_name)
}

#[tauri::command]
fn remove_tag(app: AppHandle, page_id: String, tag_name: String) -> Result<(), String> {
    storage::remove_tag(&app, &page_id, &tag_name)
}

#[tauri::command]
fn list_tags_for_page(app: AppHandle, page_id: String) -> Result<Vec<Tag>, String> {
    storage::list_tags_for_page(&app, &page_id)
}

#[tauri::command]
fn search_pages(app: AppHandle, query: String) -> Result<Vec<PageMeta>, String> {
    storage::search_pages(&app, &query)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_pages,
            add_page,
            get_page_html,
            delete_page,
            move_page,
            rename_page,
            list_collections,
            create_collection,
            rename_collection,
            move_collection,
            delete_collection,
            replace_page,
            list_versions,
            restore_version,
            add_tag,
            remove_tag,
            list_tags_for_page,
            search_pages
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
