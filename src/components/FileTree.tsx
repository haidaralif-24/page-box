import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import { Collection } from "../lib/backend";

interface FileTreeProps {
  collections: Collection[];
  selectedCollectionId: number | null;
  onSelect: (id: number | null) => void;
  onCreate: (parentId: number | null, name: string) => void;
  onRename: (id: number, newName: string) => void;
  onDelete: (collection: Collection) => void;
}

interface TreeNode extends Collection {
  children: TreeNode[];
}

type EditingState =
  | { type: "rename"; id: number }
  | { type: "create"; parentId: number }
  | null;

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

/** Inline input that appears in place of a tree label (VS Code style). */
function InlineInput({
  initialValue,
  onSubmit,
  onCancel,
  placeholder,
}: {
  initialValue: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  placeholder?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

  const commit = (cancelled: boolean) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (cancelled) {
      onCancel();
    } else {
      const trimmed = value.trim();
      if (trimmed) onSubmit(trimmed);
      else onCancel();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit(false);
    } else if (e.key === "Escape") {
      e.preventDefault();
      commit(true);
    }
    e.stopPropagation();
  };

  return (
    <input
      ref={inputRef}
      type="text"
      className="tree-inline-input"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => commit(false)}
      placeholder={placeholder}
    />
  );
}

function TreeNodeComponent({
  node,
  selectedCollectionId,
  onSelect,
  onRenameSubmit,
  onDelete,
  onStartCreate,
  onStartRename,
  onCancelEditing,
  editing,
  depth,
}: {
  node: TreeNode;
  selectedCollectionId: number | null;
  onSelect: (id: number | null) => void;
  onRenameSubmit: (id: number, newName: string) => void;
  onDelete: (collection: Collection) => void;
  onStartCreate: (parentId: number) => void;
  onStartRename: (id: number) => void;
  onCancelEditing: () => void;
  editing: EditingState;
  depth: number;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isEditingThis = editing?.type === "rename" && editing.id === node.id;
  const isCreatingHere = editing?.type === "create" && editing.parentId === node.id;

  // Auto-expand when creating a child inside this node
  useEffect(() => {
    if (isCreatingHere && !isExpanded) {
      setIsExpanded(true);
    }
  }, [isCreatingHere, isExpanded]);

  const showChildren = (isExpanded && hasChildren) || isCreatingHere;

  return (
    <div>
      <div
        className={`nav-item-wrapper ${selectedCollectionId === node.id ? "active" : ""}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isEditingThis ? (
          <div className="nav-item tree-node editing">
            <span className="tree-toggle-spacer" />
            <span className="tree-icon">📂</span>
            <InlineInput
              initialValue={node.name}
              onSubmit={(newName) => onRenameSubmit(node.id, newName)}
              onCancel={onCancelEditing}
              placeholder="Folder name"
            />
          </div>
        ) : (
          <>
            <button
              className="nav-item tree-node"
              onClick={() => onSelect(node.id)}
              title={node.name}
            >
              {hasChildren || isCreatingHere ? (
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
              <button title="New subfolder" onClick={() => onStartCreate(node.id)}>
                📁+
              </button>
              <button title="Rename" onClick={() => onStartRename(node.id)}>
                ✏️
              </button>
              <button title="Delete" onClick={() => onDelete(node)}>
                🗑️
              </button>
            </div>
          </>
        )}
      </div>

      {showChildren && (
        <div className="tree-children">
          {isCreatingHere && (
            <div
              className="nav-item-wrapper"
              style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
            >
              <div className="nav-item tree-node editing">
                <span className="tree-toggle-spacer" />
                <span className="tree-icon">📁</span>
                <InlineInput
                  initialValue=""
                  onSubmit={(name) => onRenameSubmit(-node.id, name)}
                  onCancel={onCancelEditing}
                  placeholder="New folder name"
                />
              </div>
            </div>
          )}
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              selectedCollectionId={selectedCollectionId}
              onSelect={onSelect}
              onRenameSubmit={onRenameSubmit}
              onDelete={onDelete}
              onStartCreate={onStartCreate}
              onStartRename={onStartRename}
              onCancelEditing={onCancelEditing}
              editing={editing}
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
  onCreate,
  onRename,
  onDelete,
}: FileTreeProps) {
  const [editing, setEditing] = useState<EditingState>(null);
  const [creatingAtRoot, setCreatingAtRoot] = useState(false);

  const tree = buildTree(collections);

  const handleStartCreate = (parentId: number | null) => {
    if (parentId === null) {
      setCreatingAtRoot(true);
      setEditing(null);
    } else {
      setEditing({ type: "create", parentId });
      setCreatingAtRoot(false);
    }
  };

  const handleCancelEditing = () => {
    setEditing(null);
    setCreatingAtRoot(false);
  };

  // Sign convention: positive id = rename, negative id = create child under |id|
  const handleRenameOrSubmit = (id: number, newName: string) => {
    if (id < 0) {
      onCreate(-id, newName);
    } else {
      onRename(id, newName);
    }
    handleCancelEditing();
  };

  const handleSubmitCreateAtRoot = (name: string) => {
    onCreate(null, name);
    handleCancelEditing();
  };

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
          onRenameSubmit={handleRenameOrSubmit}
          onDelete={onDelete}
          onStartCreate={handleStartCreate}
          onStartRename={(id) => {
            setEditing({ type: "rename", id });
            setCreatingAtRoot(false);
          }}
          onCancelEditing={handleCancelEditing}
          editing={editing}
          depth={0}
        />
      ))}

      {creatingAtRoot ? (
        <div className="nav-item-wrapper" style={{ paddingLeft: 8, marginTop: 8 }}>
          <div className="nav-item tree-node editing">
            <span className="tree-icon">📁</span>
            <InlineInput
              initialValue=""
              onSubmit={handleSubmitCreateAtRoot}
              onCancel={handleCancelEditing}
              placeholder="New folder name"
            />
          </div>
        </div>
      ) : (
        <button
          className="nav-item add-collection"
          onClick={() => handleStartCreate(null)}
        >
          + New Collection
        </button>
      )}
    </nav>
  );
}
