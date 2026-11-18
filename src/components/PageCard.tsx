import type { PageMeta } from "../lib/backend";

interface PageCardProps {
  page: PageMeta;
  onOpen: (page: PageMeta) => void;
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

export function PageCard({ page, onOpen }: PageCardProps) {
  return (
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
  );
}
