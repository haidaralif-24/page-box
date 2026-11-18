import { describe, expect, it } from "vitest";
import { cleanInput } from "./cleaning";

// These cases mirror the Rust tests in src-tauri/src/cleaning.rs.
// Keep both sides in sync.

describe("cleanInput", () => {
  it("strips ```html fences and surrounding prose", () => {
    const raw =
      "Here you go!\n```html\n<!doctype html><html><head><title>Hi</title></head><body><p>Hey</p></body></html>\n```\nHope that helps.";
    const cleaned = cleanInput(raw);
    expect(cleaned.html).toBe(
      "<!doctype html><html><head><title>Hi</title></head><body><p>Hey</p></body></html>",
    );
    expect(cleaned.title).toBe("Hi");
    expect(cleaned.looksLikeHtml).toBe(true);
  });

  it("joins multiple fenced blocks", () => {
    const raw = "```html\n<div>a</div>\n```\nand\n```\n<div>b</div>\n```";
    expect(cleanInput(raw).html).toBe("<div>a</div>\n<div>b</div>");
  });

  it("keeps the rest when a fence is never closed", () => {
    expect(cleanInput("prose\n```html\n<p>hi</p>").html).toBe("<p>hi</p>");
  });

  it("extracts from doctype to the LAST </html>", () => {
    const raw =
      "Sure! <!DOCTYPE html><html><body>one</body></html> and an alternative </html> tail";
    const cleaned = cleanInput(raw);
    expect(cleaned.html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(cleaned.html.endsWith("</html>")).toBe(true);
    expect(cleaned.html).not.toContain("Sure!");
    expect(cleaned.html).not.toContain("tail");
  });

  it("keeps fragments as-is, trimmed", () => {
    expect(cleanInput("  <div>hi</div>  ").html).toBe("<div>hi</div>");
  });

  it("flags plain prose but still allows saving it", () => {
    const cleaned = cleanInput("just some words, no tags");
    expect(cleaned.html).toBe("just some words, no tags");
    expect(cleaned.looksLikeHtml).toBe(false);
    expect(cleaned.title).toBe("Untitled page");
  });

  it("collapses title whitespace and accepts attributes", () => {
    const raw =
      '<html><head><title lang="en">  My   Cool\n Page </title></head><body></body></html>';
    expect(cleanInput(raw).title).toBe("My Cool Page");
  });

  it("falls back for empty or missing titles", () => {
    expect(
      cleanInput("<html><head><title>  </title></head></html>").title,
    ).toBe("Untitled page");
    expect(cleanInput("<p>no title here</p>").title).toBe("Untitled page");
    expect(cleanInput("<titlex>nope</titlex>").title).toBe("Untitled page");
  });

  it("normalizes CRLF line endings", () => {
    const raw = "```html\r\n<p>hi</p>\r\n```";
    expect(cleanInput(raw).html).toBe("<p>hi</p>");
  });

  it("leaves fence-free input unchanged", () => {
    expect(cleanInput("<p>plain</p>").html).toBe("<p>plain</p>");
  });
});
