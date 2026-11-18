/**
 * Backend bridge.
 *
 * In the Tauri app, every call goes to a Rust command (the frontend never
 * touches the filesystem). When the UI is run in a plain browser (`pnpm dev`
 * without Tauri), a localStorage-backed mock with the same interface is used
 * so the UI can be developed and demoed without a desktop build. The mock is
 * clearly labeled in the header and never used inside Tauri.
 */

import { invoke } from "@tauri-apps/api/core";
import { cleanInput } from "./cleaning";

export interface PageMeta {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

// --- Browser-only mock storage -------------------------------------------

const LS_PAGES = "pagebox:pages";
const htmlKey = (id: string) => `pagebox:html:${id}`;

function mockList(): PageMeta[] {
  try {
    return JSON.parse(localStorage.getItem(LS_PAGES) ?? "[]") as PageMeta[];
  } catch {
    return [];
  }
}

function mockSave(pages: PageMeta[]): void {
  localStorage.setItem(LS_PAGES, JSON.stringify(pages));
}

// --- Public API (same shape as the Rust commands) -------------------------

export async function listPages(): Promise<PageMeta[]> {
  if (isTauri()) return invoke<PageMeta[]>("list_pages");
  return mockList().sort((a, b) => b.createdAt - a.createdAt);
}

export async function addPage(rawText: string): Promise<PageMeta> {
  if (isTauri()) return invoke<PageMeta>("add_page", { rawText });
  const cleaned = cleanInput(rawText);
  const now = Date.now();
  const meta: PageMeta = {
    id: crypto.randomUUID(),
    title: cleaned.title,
    createdAt: now,
    updatedAt: now,
  };
  localStorage.setItem(htmlKey(meta.id), cleaned.html);
  mockSave([meta, ...mockList()]);
  return meta;
}

export async function getPageHtml(pageId: string): Promise<string> {
  if (isTauri()) return invoke<string>("get_page_html", { pageId });
  const html = localStorage.getItem(htmlKey(pageId));
  if (html === null) throw new Error("Page not found");
  return html;
}

export async function deletePage(pageId: string): Promise<void> {
  if (isTauri()) return invoke<void>("delete_page", { pageId });
  localStorage.removeItem(htmlKey(pageId));
  mockSave(mockList().filter((p) => p.id !== pageId));
}
