import { useState } from "react";
import type { Collection, PageMeta } from "../lib/backend";

interface PageCardProps {
  page: PageMeta;
  onOpen: (page: PageMeta) => void;
  onMove: (page: PageMeta, newCollectionId: number | null) => void;
  collections: Collection[];
}

function formatDate(millis: number): string {
  return new Date(millis).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PageCard({ page, onOpen, onMove, collections }: PageCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  function handleMoveClick(e: React.MouseEvent, newCollectionId: number | null) {
    e.stopPropagation();
    onMove(page, newCollectionId);
    setShowMenu(false);
  }

  return (
    <div className="page-card-wrapper">
      <button className="page-card" onClick={() => onOpen(page)}>
        <svg
          className="page-card-icon"
          viewBox="0 0 24 24"
          width="28"
          height="28"
          aria-hidden="true"
        >
          <path
            d="M6 2h9l5 5v15H6z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M15 2v5h5M9 12h8M9 16h8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <span className="page-card-title">{page.title}</span>
        <span className="page-card-date">{formatDate(page.createdAt)}</span>
      </button>
      
      <div className="page-card-actions">
        <button 
          className="icon-btn" 
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          title="Move to collection"
        >
          ⋮
        </button>
        {showMenu && (
          <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
            <button 
              className="dropdown-item" 
              onClick={(e) => handleMoveClick(e, null)}
            >
              📁 Unsorted
            </button>
            {collections.map((c) => (
              <button
                key={c.id}
                className="dropdown-item"
                onClick={(e) => handleMoveClick(e, c.id)}
              >
                📂 {c.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
