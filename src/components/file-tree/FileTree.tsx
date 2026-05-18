import { useEffect, useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { FileNode, GitStatus } from '../../types/ipc';
import { FilePreviewModal } from './FilePreviewModal';
import { ContextMenu } from './ContextMenu';
import path from 'path-browserify';
import { tauriAPI } from '../../utils/tauri-api';

export function FileTree() {
  const { fileTree, projectPath, loadFileTree, isLoadingTree } = useProjectStore();
  const [previewFile, setPreviewFile] = useState<{ path: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [gitStatus, setGitStatus] = useState<GitStatus>({});
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: FileNode;
  } | null>(null);

  useEffect(() => {
    if (projectPath) {
      loadFileTree();
      loadGitStatus();
    }
  }, [projectPath, loadFileTree]);

  const loadGitStatus = async () => {
    if (!projectPath) return;
    try {
      const status = await tauriAPI.getGitStatus(projectPath);
      setGitStatus(status);
    } catch (error) {
      console.error('Failed to load git status:', error);
      setGitStatus({});
    }
  };

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node
    });
  };

  const handleCreateFile = async () => {
    if (!contextMenu) return;
    const fileName = prompt('Enter file name:');
    if (!fileName) return;

    try {
      const parentPath = contextMenu.node.type === 'directory'
        ? contextMenu.node.path
        : path.dirname(contextMenu.node.path);
      const newFilePath = path.join(parentPath, fileName);

      await tauriAPI.createFile(newFilePath);
      await loadFileTree();
      await loadGitStatus();
    } catch (error) {
      alert(`Failed to create file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setContextMenu(null);
    }
  };

  const handleCreateFolder = async () => {
    if (!contextMenu) return;
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    try {
      const parentPath = contextMenu.node.type === 'directory'
        ? contextMenu.node.path
        : path.dirname(contextMenu.node.path);
      const newFolderPath = path.join(parentPath, folderName);

      await tauriAPI.createFolder(newFolderPath);
      await loadFileTree();
    } catch (error) {
      alert(`Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setContextMenu(null);
    }
  };

  const handleRename = async () => {
    if (!contextMenu) return;
    const currentName = contextMenu.node.name;
    const newName = prompt('Enter new name:', currentName);
    if (!newName || newName === currentName) return;

    try {
      const parentPath = path.dirname(contextMenu.node.path);
      const newPath = path.join(parentPath, newName);

      await tauriAPI.renameFile(contextMenu.node.path, newPath);
      await loadFileTree();
      await loadGitStatus();
    } catch (error) {
      alert(`Failed to rename: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setContextMenu(null);
    }
  };

  const handleDelete = async () => {
    if (!contextMenu) return;
    const confirmMessage = contextMenu.node.type === 'directory'
      ? `Are you sure you want to delete the folder "${contextMenu.node.name}" and all its contents?`
      : `Are you sure you want to delete "${contextMenu.node.name}"?`;

    if (!confirm(confirmMessage)) return;

    try {
      await tauriAPI.deleteFile(contextMenu.node.path);
      await loadFileTree();
      await loadGitStatus();
    } catch (error) {
      alert(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setContextMenu(null);
    }
  };

  if (!projectPath) {
    return (
      <div className="p-4 text-sm text-gray-500">
        No project selected
      </div>
    );
  }

  if (isLoadingTree) {
    return (
      <div className="p-4 text-sm text-gray-500">
        Loading project files...
      </div>
    );
  }

  if (fileTree.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500">
        Project is empty
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Search Header */}
      <div className="flex-shrink-0 p-2 border-b border-gray-300">
        <div className="relative">
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-claude-accent focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Scrollable File Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {fileTree.map(node => (
          <FileTreeNode
            key={node.path}
            node={node}
            level={0}
            rootPath={projectPath}
            onFileClick={(path, name) => setPreviewFile({ path, name })}
            onContextMenu={handleContextMenu}
            searchQuery={searchQuery}
            gitStatus={gitStatus}
          />
        ))}
      </div>

      <FilePreviewModal
        isOpen={previewFile !== null}
        onClose={() => setPreviewFile(null)}
        filePath={previewFile?.path || ''}
        fileName={previewFile?.name || ''}
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isDirectory={contextMenu.node.type === 'directory'}
          onClose={() => setContextMenu(null)}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

interface FileTreeNodeProps {
  node: FileNode;
  level: number;
  rootPath: string;
  onFileClick: (path: string, name: string) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
  searchQuery: string;
  gitStatus: GitStatus;
}

function FileTreeNode({ node, level, rootPath, onFileClick, onContextMenu, searchQuery, gitStatus }: FileTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<FileNode[]>(node.children || []);
  const [isLoading, setIsLoading] = useState(false);

  // Check if this node or any descendant matches the search
  const matchesSearch = (n: FileNode, query: string): boolean => {
    if (!query) return true;
    const lowerQuery = query.toLowerCase();
    if (n.name.toLowerCase().includes(lowerQuery)) return true;

    // For directories, check if any children match
    if (n.type === 'directory' && n.children) {
      return n.children.some(child => matchesSearch(child, query));
    }
    return false;
  };

  const nodeMatches = matchesSearch(node, searchQuery);

  // Auto-expand directories when searching if they contain matches
  useEffect(() => {
    if (searchQuery && node.type === 'directory' && nodeMatches && children.length > 0) {
      // Check if any children match
      const hasMatchingChildren = children.some(child => matchesSearch(child, searchQuery));
      if (hasMatchingChildren && !isExpanded) {
        setIsExpanded(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Don't render if doesn't match search
  if (!nodeMatches) {
    return null;
  }

  const handleClick = async () => {
    if (node.type === 'directory') {
      if (!isExpanded && children.length === 0) {
        // Load directory contents on first expand
        setIsLoading(true);
        try {
          const loadedChildren = await tauriAPI.loadDirectory(node.path, rootPath);
          setChildren(loadedChildren);
        } catch (error) {
          console.error('Failed to load directory:', error);
        } finally {
          setIsLoading(false);
        }
      }
      setIsExpanded(!isExpanded);
    } else {
      // File clicked - open preview
      console.log('[FileTree] File clicked:', node.name, 'Path:', node.path);
      onFileClick(node.path, node.name);
    }
  };

  const paddingLeft = level * 16;

  // Normalize path for git status lookup
  const normalizedPath = node.path.replace(/\\/g, '/');
  const fileStatus = gitStatus[normalizedPath];

  // Get status indicator
  const getStatusIndicator = () => {
    if (!fileStatus) return null;

    const indicators = {
      modified: { symbol: 'M', color: 'text-orange-600', title: 'Modified' },
      added: { symbol: 'A', color: 'text-green-600', title: 'Added' },
      deleted: { symbol: 'D', color: 'text-red-600', title: 'Deleted' },
      untracked: { symbol: 'U', color: 'text-blue-600', title: 'Untracked' },
      renamed: { symbol: 'R', color: 'text-purple-600', title: 'Renamed' }
    };

    const indicator = indicators[fileStatus];
    if (!indicator) return null;

    return (
      <span
        className={`${indicator.color} font-semibold text-xs`}
        title={indicator.title}
      >
        {indicator.symbol}
      </span>
    );
  };

  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return text;

    return (
      <>
        {text.slice(0, index)}
        <span className="bg-yellow-200">{text.slice(index, index + query.length)}</span>
        {text.slice(index + query.length)}
      </>
    );
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (node.type === 'file') {
      // Get relative path from root
      const relativePath = node.path.replace(rootPath, '').replace(/\\/g, '/').replace(/^\//, '');
      e.dataTransfer.setData('text/plain', `@${relativePath}`);
      e.dataTransfer.effectAllowed = 'copy';
    }
  };

  return (
    <div>
      <div
        className="flex items-center gap-1 px-2 py-1 hover:bg-gray-200 cursor-pointer rounded text-sm"
        onClick={handleClick}
        onContextMenu={(e) => onContextMenu(e, node)}
        style={{ paddingLeft: `${paddingLeft + 8}px` }}
        draggable={node.type === 'file'}
        onDragStart={handleDragStart}
      >
        {node.type === 'directory' ? (
          <>
            <span className="text-gray-600">{isLoading ? '⟳' : isExpanded ? '▼' : '▶'}</span>
            <span>📁</span>
          </>
        ) : (
          <>
            <span className="w-4" />
            <span>📄</span>
          </>
        )}
        <span className="ml-1 flex-1">{highlightText(node.name, searchQuery)}</span>
        {getStatusIndicator()}
      </div>

      {isExpanded && children.length > 0 && (
        <div>
          {children.map(child => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              rootPath={rootPath}
              onFileClick={onFileClick}
              onContextMenu={onContextMenu}
              searchQuery={searchQuery}
              gitStatus={gitStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
