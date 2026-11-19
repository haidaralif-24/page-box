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
  collectionId: number | null;
  title: string;
  fileName: string;
  createdAt: number;
  updatedAt: number;
}

export interface Collection {
  id: number;
  parentId: number | null;
  name: string;
  relPath: string;
  createdAt: string;
}

export interface Version {
  id: number;
  pageId: string;
  fileName: string;
  createdAt: number;
}

export interface Tag {
  id: number;
  name: string;
}

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

// --- Browser-only mock storage -------------------------------------------

const LS_PAGES = "pagebox:pages";
const LS_COLLECTIONS = "pagebox:collections";
const htmlKey = (id: string) => `pagebox:html:${id}`;

function mockListPages(): PageMeta[] {
  try {
    return JSON.parse(localStorage.getItem(LS_PAGES) ?? "[]") as PageMeta[];
  } catch {
    return [];
  }
}

function mockSavePages(pages: PageMeta[]): void {
  localStorage.setItem(LS_PAGES, JSON.stringify(pages));
}

function mockListCollections(): Collection[] {
  try {
    return JSON.parse(localStorage.getItem(LS_COLLECTIONS) ?? "[]") as Collection[];
  } catch {
    return [];
  }
}

function mockSaveCollections(collections: Collection[]): void {
  localStorage.setItem(LS_COLLECTIONS, JSON.stringify(collections));
}

// --- Public API (same shape as the Rust commands) -------------------------

export async function listPages(collectionId?: number | null): Promise<PageMeta[]> {
  if (isTauri()) return invoke<PageMeta[]>("list_pages", { collectionId });
  const pages = mockListPages();
  const filtered = collectionId !== undefined
    ? pages.filter(p => p.collectionId === collectionId)
    : pages.filter(p => p.collectionId === null);
  return filtered.sort((a, b) => b.createdAt - a.createdAt);
}

export async function addPage(rawText: string, collectionId?: number | null): Promise<PageMeta> {
  if (isTauri()) return invoke<PageMeta>("add_page", { rawText, collectionId });
  const cleaned = cleanInput(rawText);
  const now = Date.now();
  const slug = cleaned.title.toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const meta: PageMeta = {
    id: crypto.randomUUID(),
    collectionId: collectionId ?? null,
    title: cleaned.title,
    fileName: `${slug || "untitled"}.html`,
    createdAt: now,
    updatedAt: now,
  };
  localStorage.setItem(htmlKey(meta.id), cleaned.html);
  mockSavePages([meta, ...mockListPages()]);
  return meta;
}

export async function deletePage(pageId: string): Promise<void> {
  if (isTauri()) return invoke<void>("delete_page", { pageId });
  localStorage.removeItem(htmlKey(pageId));
  mockSavePages(mockListPages().filter((p) => p.id !== pageId));
}

export async function movePage(pageId: string, collectionId: number | null): Promise<void> {
  if (isTauri()) return invoke<void>("move_page", { pageId, collectionId });
  const pages = mockListPages().map(p =>
    p.id === pageId ? { ...p, collectionId } : p
  );
  mockSavePages(pages);
}

export async function renamePage(pageId: string, title: string): Promise<void> {
  if (isTauri()) return invoke<void>("rename_page", { pageId, title });
  const slug = title.toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const pages = mockListPages().map(p =>
    p.id === pageId ? { ...p, title, fileName: `${slug || "untitled"}.html`, updatedAt: Date.now() } : p
  );
  mockSavePages(pages);
}

export async function listCollections(): Promise<Collection[]> {
  if (isTauri()) return invoke<Collection[]>("list_collections");
  return mockListCollections();
}

export async function createCollection(name: string, parentId: number | null = null): Promise<Collection> {
  if (isTauri()) return invoke<Collection>("create_collection", { name, parentId });
  const collections = mockListCollections();
  const parent = parentId ? collections.find(c => c.id === parentId) : null;
  const slug = name.toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const relPath = parent ? `${parent.relPath}/${slug}` : slug;
  
  const newCollection: Collection = {
    id: Math.max(0, ...collections.map(c => c.id)) + 1,
    parentId,
    name,
    relPath,
    createdAt: new Date().toISOString(),
  };
  mockSaveCollections([...collections, newCollection]);
  return newCollection;
}

export async function renameCollection(id: number, name: string): Promise<void> {
  if (isTauri()) return invoke<void>("rename_collection", { id, name });
  const collections = mockListCollections().map(c =>
    c.id === id ? { ...c, name } : c
  );
  mockSaveCollections(collections);
}

export async function moveCollection(id: number, newParentId: number | null): Promise<void> {
  if (isTauri()) return invoke<void>("move_collection", { id, newParentId });
  const collections = mockListCollections().map(c =>
    c.id === id ? { ...c, parentId: newParentId } : c
  );
  mockSaveCollections(collections);
}

export async function deleteCollection(id: number): Promise<void> {
  if (isTauri()) return invoke<void>("delete_collection", { id });
  const pages = mockListPages().map(p =>
    p.collectionId === id ? { ...p, collectionId: null } : p
  );
  mockSavePages(pages);

  const collections = mockListCollections().filter(c => c.id !== id && c.parentId !== id);
  mockSaveCollections(collections);
}

export async function getPageHtml(pageId: string, versionId?: number | null): Promise<string> {
  if (isTauri()) return invoke<string>("get_page_html", { pageId, versionId });
  const html = localStorage.getItem(`pagebox:html:${pageId}`);
  if (html === null) throw new Error("Page not found");
  return html;
}

export async function replacePage(pageId: string, rawText: string): Promise<PageMeta> {
  if (isTauri()) return invoke<PageMeta>("replace_page", { pageId, rawText });
  const cleaned = cleanInput(rawText);
  const now = Date.now();
  const pages = mockListPages();
  const page = pages.find(p => p.id === pageId);
  if (!page) throw new Error("Page not found");
  const updated = { ...page, title: cleaned.title, updatedAt: now };
  mockSavePages(pages.map(p => p.id === pageId ? updated : p));
  localStorage.setItem(`pagebox:html:${pageId}`, cleaned.html);
  return updated;
}

export async function listVersions(pageId: string): Promise<Version[]> {
  if (isTauri()) return invoke<Version[]>("list_versions", { pageId });
  return [];
}

export async function restoreVersion(pageId: string, versionId: number): Promise<void> {
  if (isTauri()) return invoke<void>("restore_version", { pageId, versionId });
}

export async function addTag(pageId: string, tagName: string): Promise<void> {
  if (isTauri()) return invoke<void>("add_tag", { pageId, tagName });
}

export async function removeTag(pageId: string, tagName: string): Promise<void> {
  if (isTauri()) return invoke<void>("remove_tag", { pageId, tagName });
}

export async function listTagsForPage(pageId: string): Promise<Tag[]> {
  if (isTauri()) return invoke<Tag[]>("list_tags_for_page", { pageId });
  return [];
}

export async function searchPages(query: string): Promise<PageMeta[]> {
  if (isTauri()) return invoke<PageMeta[]>("search_pages", { query });
  const pages = mockListPages();
  const q = query.toLowerCase();
  return pages.filter(p => p.title.toLowerCase().includes(q));
}