import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import { Collection } from "../lib/backend";
import {
  FolderIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  AllPagesIcon,
  UnsortedIcon,
  EditIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "./Icons";

interface FileTreeProps {
  collections: Collection[];
  pageCounts: Map<number | null, number>;
  selectedCollectionId: number | null;
  isAllSelected: boolean;
  onSelectAll: () => void;
  onSelectUnsorted: () => void;
  onSelect: (id: number) => void;
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
  pageCounts,
}: {
  node: TreeNode;
  selectedCollectionId: number | null;
  onSelect: (id: number) => void;
  onRenameSubmit: (id: number, newName: string) => void;
  onDelete: (collection: Collection) => void;
  onStartCreate: (parentId: number) => void;
  onStartRename: (id: number) => void;
  onCancelEditing: () => void;
  editing: EditingState;
  depth: number;
  pageCounts: Map<number | null, number>;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isEditingThis = editing?.type === "rename" && editing.id === node.id;
  const isCreatingHere = editing?.type === "create" && editing.parentId === node.id;

  useEffect(() => {
    if (isCreatingHere && !isExpanded) {
      setIsExpanded(true);
    }
  }, [isCreatingHere, isExpanded]);

  const showChildren = (isExpanded && hasChildren) || isCreatingHere;
  const count = pageCounts.get(node.id) ?? 0;

  return (
    <div>
      <div
        className={`nav-item-wrapper ${selectedCollectionId === node.id ? "active" : ""}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isEditingThis ? (
          <div className="nav-item tree-node editing">
            <span className="tree-toggle-spacer" />
            <span className="tree-icon"><FolderOpenIcon size={16} /></span>
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
                  {isExpanded ? <ChevronDownIcon size={12} /> : <ChevronRightIcon size={12} />}
                </span>
              ) : (
                <span className="tree-toggle-spacer" />
              )}
              <span className="tree-icon">
                {hasChildren ? <FolderIcon size={16} /> : <FolderOpenIcon size={16} />}
              </span>
              <span className="tree-label">{node.name}</span>
              {count > 0 && <span className="tree-count">{count}</span>}
            </button>
            <div className="nav-actions">
              <button title="New subfolder" onClick={() => onStartCreate(node.id)}>
                <FolderPlusIcon size={14} />
              </button>
              <button title="Rename" onClick={() => onStartRename(node.id)}>
                <EditIcon size={14} />
              </button>
              <button title="Delete" onClick={() => onDelete(node)}>
                <TrashIcon size={14} />
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
                <span className="tree-icon"><FolderIcon size={16} /></span>
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
              pageCounts={pageCounts}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({
  collections,
  pageCounts,
  selectedCollectionId,
  isAllSelected,
  onSelectAll,
  onSelectUnsorted,
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

  const unsortedCount = pageCounts.get(null) ?? 0;
  const totalPageCount = Array.from(pageCounts.values()).reduce((sum, c) => sum + c, 0);

  return (
    <nav className="sidebar-nav">
      <button
        className={`nav-item ${isAllSelected ? "active" : ""}`}
        onClick={onSelectAll}
      >
        <span className="tree-icon"><AllPagesIcon size={16} /></span>
        <span className="tree-label">All Pages</span>
        {totalPageCount > 0 && <span className="tree-count">{totalPageCount}</span>}
      </button>

      <button
        className={`nav-item ${!isAllSelected && selectedCollectionId === null ? "active" : ""}`}
        onClick={onSelectUnsorted}
      >
        <span className="tree-icon"><UnsortedIcon size={16} /></span>
        <span className="tree-label">Unsorted</span>
        {unsortedCount > 0 && <span className="tree-count">{unsortedCount}</span>}
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
          pageCounts={pageCounts}
        />
      ))}

      {creatingAtRoot ? (
        <div className="nav-item-wrapper" style={{ paddingLeft: 8, marginTop: 8 }}>
          <div className="nav-item tree-node editing">
            <span className="tree-icon"><FolderIcon size={16} /></span>
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
          <FolderPlusIcon size={16} />
          <span>New Collection</span>
        </button>
      )}
    </nav>
  );
}
