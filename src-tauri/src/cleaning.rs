//! Input cleaning for pasted AI output (SPEC.md §7.1).
//!
//! Mirrored in `src/lib/cleaning.ts` for instant UI feedback in the paste
//! dialog. This module is the source of truth: input is always re-cleaned
//! here before anything is written to disk.

use serde::Serialize;

const FALLBACK_TITLE: &str = "Untitled page";

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanedInput {
    pub html: String,
    pub title: String,
    pub looks_like_html: bool,
}

pub fn clean_input(raw: &str) -> CleanedInput {
    let unfenced = strip_code_fences(raw);
    let html = extract_html(&unfenced);
    let title = detect_title(&html);
    let looks_like_html = looks_like_html(&html);
    CleanedInput {
        html,
        title,
        looks_like_html,
    }
}

/// If the text contains markdown code fences, keep only the fenced content
/// (joined across blocks). Otherwise return the text unchanged.
fn strip_code_fences(raw: &str) -> String {
    let mut inside = false;
    let mut found_fence = false;
    let mut kept: Vec<&str> = Vec::new();
    for line in raw.lines() {
        if line.trim_start().starts_with("```") {
            found_fence = true;
            inside = !inside;
            continue;
        }
        if inside {
            kept.push(line);
        }
    }
    if found_fence {
        kept.join("\n")
    } else {
        raw.to_string()
    }
}

/// Extract from the first `<!doctype` or `<html` to the last `</html>` when
/// possible. Fragments (no doctype/html tag) are kept as-is, trimmed.
fn extract_html(text: &str) -> String {
    let doctype = find_ignore_ascii_case(text, "<!doctype");
    let html_tag = find_tag(text, "html");
    let start = [doctype, html_tag].into_iter().flatten().min();
    match start {
        Some(s) => {
            let end = rfind_ignore_ascii_case(text, "</html>").map(|e| e + "</html>".len());
            match end {
                Some(e) if e > s => text[s..e].trim().to_string(),
                _ => text[s..].trim().to_string(),
            }
        }
        None => text.trim().to_string(),
    }
}

/// Title = contents of the first `<title>` element, whitespace collapsed.
/// Fallback = "Untitled page".
fn detect_title(html: &str) -> String {
    let Some(open) = find_tag(html, "title") else {
        return FALLBACK_TITLE.to_string();
    };
    let Some(gt) = html[open..].find('>').map(|i| open + i) else {
        return FALLBACK_TITLE.to_string();
    };
    let content_start = gt + 1;
    let Some(close) = find_ignore_ascii_case(&html[content_start..], "</title") else {
        return FALLBACK_TITLE.to_string();
    };
    let title = html[content_start..content_start + close]
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ");
    if title.is_empty() {
        FALLBACK_TITLE.to_string()
    } else {
        title
    }
}

/// True if the text contains anything that looks like an HTML tag.
fn looks_like_html(text: &str) -> bool {
    text.as_bytes()
        .windows(2)
        .any(|w| w[0] == b'<' && (w[1].is_ascii_alphabetic() || w[1] == b'!'))
}

/// Find `<name` followed by `>`, `/`, whitespace, or end of input, so that
/// e.g. `<title` does not match `<titlex`. Case-insensitive (ASCII).
fn find_tag(html: &str, name: &str) -> Option<usize> {
    let needle = format!("<{name}");
    let mut from = 0;
    while let Some(rel) = find_ignore_ascii_case(&html[from..], &needle) {
        let i = from + rel;
        let after = i + needle.len();
        let ok = html[after..]
            .chars()
            .next()
            .is_none_or(|c| c == '>' || c == '/' || c.is_whitespace());
        if ok {
            return Some(i);
        }
        from = after;
    }
    None
}

/// ASCII case-insensitive search that returns byte indices into the ORIGINAL
/// string (lowercasing the whole string first would shift indices for some
/// Unicode input).
fn find_ignore_ascii_case(haystack: &str, needle: &str) -> Option<usize> {
    let n = needle.as_bytes();
    haystack.char_indices().find_map(|(i, _)| {
        let window = haystack.as_bytes().get(i..i + n.len())?;
        if window.eq_ignore_ascii_case(n) {
            Some(i)
        } else {
            None
        }
    })
}

fn rfind_ignore_ascii_case(haystack: &str, needle: &str) -> Option<usize> {
    let n = needle.as_bytes();
    let mut last = None;
    for (i, _) in haystack.char_indices() {
        if let Some(window) = haystack.as_bytes().get(i..i + n.len()) {
            if window.eq_ignore_ascii_case(n) {
                last = Some(i);
            }
        }
    }
    last
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn strips_html_fences_with_prose() {
        let raw = "Here you go!\n```html\n<!doctype html><html><head><title>Hi</title></head><body><p>Hey</p></body></html>\n```\nHope that helps.";
        let cleaned = clean_input(raw);
        assert_eq!(
            cleaned.html,
            "<!doctype html><html><head><title>Hi</title></head><body><p>Hey</p></body></html>"
        );
        assert_eq!(cleaned.title, "Hi");
        assert!(cleaned.looks_like_html);
    }

    #[test]
    fn joins_multiple_fenced_blocks() {
        let raw = "```html\n<div>a</div>\n```\nand\n```\n<div>b</div>\n```";
        assert_eq!(clean_input(raw).html, "<div>a</div>\n<div>b</div>");
    }

    #[test]
    fn unclosed_fence_keeps_the_rest() {
        let raw = "prose\n```html\n<p>hi</p>";
        assert_eq!(clean_input(raw).html, "<p>hi</p>");
    }

    #[test]
    fn extracts_doctype_to_last_closing_html() {
        let raw = "Sure! <!DOCTYPE html><html><body>one</body></html> and an alternative </html> tail";
        let cleaned = clean_input(raw);
        assert!(cleaned.html.starts_with("<!DOCTYPE html>"));
        assert!(cleaned.html.ends_with("</html>"));
        assert!(!cleaned.html.contains("Sure!"));
        assert!(!cleaned.html.contains("tail"));
    }

    #[test]
    fn keeps_fragments_and_plain_prose() {
        assert_eq!(clean_input("  <div>hi</div>  ").html, "<div>hi</div>");
        let prose = clean_input("just some words, no tags");
        assert_eq!(prose.html, "just some words, no tags");
        assert!(!prose.looks_like_html);
        assert_eq!(prose.title, "Untitled page");
    }

    #[test]
    fn title_whitespace_collapsed_and_attributes_ok() {
        let raw = "<html><head><title lang=\"en\">  My   Cool\n Page </title></head><body></body></html>";
        assert_eq!(clean_input(raw).title, "My Cool Page");
    }

    #[test]
    fn empty_or_missing_title_falls_back() {
        assert_eq!(clean_input("<html><head><title>  </title></head></html>").title, "Untitled page");
        assert_eq!(clean_input("<p>no title here</p>").title, "Untitled page");
        // `<titlex>` must not be treated as `<title>`
        assert_eq!(clean_input("<titlex>nope</titlex>").title, "Untitled page");
    }

    #[test]
    fn no_fences_means_unchanged() {
        let raw = "<p>plain</p>";
        assert_eq!(clean_input(raw).html, raw);
    }
}
