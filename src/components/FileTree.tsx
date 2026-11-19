import { useState } from "react";
import { Collection } from "../lib/backend";

interface FileTreeProps {
  collections: Collection[];
  selectedCollectionId: number | null;
  onSelect: (id: number | null) => void;
  onRename: (collection: Collection) => void;
  onDelete: (collection: Collection) => void;
  onCreateChild: (parentId: number) => void;
}

interface TreeNode extends Collection {
  children: TreeNode[];
}

function buildTree(collections: Collection[]): TreeNode[] {
  const map = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];

  collections.forEach((c) => {
    map.set(c.id, { ...c, children: [] });
  });

  collections.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parentId !== null && map.has(c.parentId)) {
      map.get(c.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function TreeNodeComponent({
  node,
  selectedCollectionId,
  onSelect,
  onRename,
  onDelete,
  onCreateChild,
  depth = 0,
}: {
  node: TreeNode;
  selectedCollectionId: number | null;
  onSelect: (id: number | null) => void;
  onRename: (collection: Collection) => void;
  onDelete: (collection: Collection) => void;
  onCreateChild: (parentId: number) => void;
  depth: number;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={`nav-item-wrapper ${selectedCollectionId === node.id ? "active" : ""}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <button
          className="nav-item tree-node"
          onClick={() => onSelect(node.id)}
          title={node.name}
        >
          {hasChildren ? (
            <span
              className="tree-toggle"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? "▼" : "▶"}
            </span>
          ) : (
            <span className="tree-toggle-spacer" />
          )}
          <span className="tree-icon">{hasChildren ? "📁" : "📂"}</span>
          <span className="tree-label">{node.name}</span>
        </button>
        <div className="nav-actions">
          <button title="New subfolder" onClick={() => onCreateChild(node.id)}>
            📁+
          </button>
          <button title="Rename" onClick={() => onRename(node)}>
            ✏️
          </button>
          <button title="Delete" onClick={() => onDelete(node)}>
            🗑️
          </button>
        </div>
      </div>
      {isExpanded && hasChildren && (
        <div className="tree-children">
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              selectedCollectionId={selectedCollectionId}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
              onCreateChild={onCreateChild}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({
  collections,
  selectedCollectionId,
  onSelect,
  onRename,
  onDelete,
  onCreateChild,
}: FileTreeProps) {
  const tree = buildTree(collections);

  return (
    <nav className="sidebar-nav">
      <button
        className={`nav-item ${selectedCollectionId === null ? "active" : ""}`}
        onClick={() => onSelect(null)}
      >
        <span className="tree-icon">📁</span>
        <span className="tree-label">Unsorted</span>
      </button>
      {tree.map((node) => (
        <TreeNodeComponent
          key={node.id}
          node={node}
          selectedCollectionId={selectedCollectionId}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
          onCreateChild={onCreateChild}
          depth={0}
        />
      ))}
      <button className="nav-item add-collection" onClick={() => onCreateChild(-1)}>
        + New Collection
      </button>
    </nav>
  );
}