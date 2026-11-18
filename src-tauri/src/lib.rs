mod cleaning;
mod storage;

use storage::PageMeta;
use tauri::AppHandle;

#[tauri::command]
fn list_pages(app: AppHandle) -> Result<Vec<PageMeta>, String> {
    storage::list_pages(&app)
}

#[tauri::command]
fn add_page(app: AppHandle, raw_text: String) -> Result<PageMeta, String> {
    storage::add_page(&app, &raw_text)
}

#[tauri::command]
fn get_page_html(app: AppHandle, page_id: String) -> Result<String, String> {
    storage::get_page_html(&app, &page_id)
}

#[tauri::command]
fn delete_page(app: AppHandle, page_id: String) -> Result<(), String> {
    storage::delete_page(&app, &page_id)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_pages,
            add_page,
            get_page_html,
            delete_page
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
