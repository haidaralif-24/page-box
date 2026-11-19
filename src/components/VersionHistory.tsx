import { useState, useEffect } from "react";
import { Version, listVersions, restoreVersion, getPageHtml } from "../lib/backend";

interface Props {
  pageId: string;
  onClose: () => void;
  onRestore: () => void;
}

export function VersionHistory({ pageId, onClose, onRestore }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string>("");

  useEffect(() => {
    listVersions(pageId).then(setVersions);
  }, [pageId]);

  const handlePreview = async (v: Version) => {
    const html = await getPageHtml(pageId, v.id);
    setPreviewHtml(html);
  };

  const handleRestore = async (v: Version) => {
    if (confirm("Restore this version? The current version will be saved as a new snapshot.")) {
      await restoreVersion(pageId, v.id);
      onRestore();
      onClose();
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
      <div style={{ background: "white", padding: 20, borderRadius: 8, width: 600, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Version History</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "flex", gap: 16, flex: 1, overflow: "hidden" }}>
          <div style={{ width: 200, overflowY: "auto", borderRight: "1px solid #ccc", paddingRight: 8 }}>
            {versions.map(v => (
              <div key={v.id} style={{ padding: 8, cursor: "pointer", borderRadius: 4 }}
                   onMouseEnter={() => handlePreview(v)}>
                <div style={{ fontWeight: "bold" }}>v{v.id}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{new Date(v.createdAt).toLocaleString()}</div>
                <button onClick={() => handleRestore(v)} style={{ marginTop: 4, fontSize: 12 }}>Restore</button>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, border: "1px solid #ccc", borderRadius: 4, overflow: "hidden" }}>
            {previewHtml ? (
              <iframe srcDoc={previewHtml} style={{ width: "100%", height: "100%", border: "none" }}
                      sandbox="allow-scripts" />
            ) : (
              <div style={{ padding: 16, color: "#666" }}>Hover over a version to preview</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
