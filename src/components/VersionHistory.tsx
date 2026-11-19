import { useState, useEffect } from "react";
import { Version, listVersions, getPageHtml } from "../lib/backend";

interface Props {
  pageId: string;
  onClose: () => void;
  /** Called when the user wants to restore a version. Parent shows a confirm dialog. */
  onRequestRestore: (version: Version) => void;
}

export function VersionHistory({ pageId, onClose, onRequestRestore }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);

  useEffect(() => {
    listVersions(pageId).then(setVersions);
  }, [pageId]);

  const handlePreview = async (v: Version) => {
    setSelectedVersionId(v.id);
    try {
      const html = await getPageHtml(pageId, v.id);
      setPreviewHtml(html);
    } catch (e) {
      setPreviewHtml("");
    }
  };

  const selectedVersion = versions.find((v) => v.id === selectedVersionId);

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="version-history-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="version-history-header">
          <h3>Version History</h3>
          <button className="version-history-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="version-history-body">
          <div className="version-list">
            {versions.length === 0 && (
              <p className="muted" style={{ padding: 8, fontSize: 13 }}>
                No versions yet.
              </p>
            )}
            {versions.map((v) => (
              <div
                key={v.id}
                className={`version-item ${selectedVersionId === v.id ? "selected" : ""}`}
                onMouseEnter={() => handlePreview(v)}
                onFocus={() => handlePreview(v)}
                tabIndex={0}
              >
                <div className="version-item-title">v{v.id}</div>
                <div className="version-item-date">
                  {new Date(v.createdAt).toLocaleString()}
                </div>
                <button
                  className="btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestRestore(v);
                  }}
                  style={{ marginTop: 4, fontSize: 12, padding: "3px 10px" }}
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
          <div className="version-preview">
            {previewHtml ? (
              <iframe
                srcDoc={previewHtml}
                title="Version preview"
                sandbox="allow-scripts"
              />
            ) : (
              <div className="version-preview-empty">
                {selectedVersion
                  ? "Loading preview…"
                  : "Hover over a version to preview"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
