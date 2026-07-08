import { useEffect, useState, useRef } from 'react';
import { useDragStore } from '../../stores/dragStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useTabStore } from '../../stores/tabStore';
import { FileNode } from '../../types/ipc';
import { FilePreviewPanel } from './FilePreviewPanel';
import { ContextMenu } from './ContextMenu';
import { SessionBrowser } from '../chat/SessionBrowser';
import path from 'path-browserify';
import { tauriAPI } from '../../utils/tauri-api';
import type { PermissionMode } from '../../types/permissions';
import { PERMISSION_MODE_DISPLAYS } from '../../types/permissions';
import { listen } from '@tauri-apps/api/event';

const MODELS = [
  { id: 'claude-sonnet-4-6', name: 'Sonnet 4.6' },
  { id: 'claude-opus-4-7', name: 'Opus 4.7' },
  { id: 'claude-haiku-4-5', name: 'Haiku 4.5' },
];

function formatTokenCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export function FileTree() {
  const { selectedModel, setSelectedModel } = useSettingsStore();
  const { getActiveTab, activeTabId, getActiveFileTreeState, setFileTree, setLoadingTree, updateTab } = useTabStore();
  const activeTab = getActiveTab();
  const projectPath = activeTab?.projectPath || null;

  // Get file tree from active tab
  const { fileTree, isLoadingTree } = getActiveFileTreeState();
  const [previewFile, setPreviewFile] = useState<{ path: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { setDraggedFile } = useDragStore();
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: FileNode;
  } | null>(null);

  // Permission mode state (per-tab in future)
  const [permissionMode, setPermissionModeState] = useState<PermissionMode>(
    (localStorage.getItem('permissionMode') as PermissionMode) || 'acceptEdits'
  );
  const [isPermDropdownOpen, setIsPermDropdownOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [showSessionBrowser, setShowSessionBrowser] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const permDropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  const setPermissionMode = async (mode: PermissionMode) => {
    setPermissionModeState(mode);
    localStorage.setItem('permissionMode', mode);
    console.log('[FileTree] Permission mode set to:', mode);

    // Update Rust backend
    try {
      await tauriAPI.setPermissionMode(mode);
      console.log('[FileTree] Backend permission mode updated');
    } catch (error) {
      console.error('[FileTree] Failed to set backend permission mode:', error);
    }

    // Update active tab's permission mode
    if (activeTabId) {
      const { updateTab } = useTabStore.getState();
      updateTab(activeTabId, { permissionMode: mode });
      console.log('[FileTree] Tab permission mode updated');
    }

    setIsPermDropdownOpen(false);
  };

  // Load file tree for active tab
  const loadFileTree = async () => {
    if (!activeTabId || !projectPath) return;

    setLoadingTree(activeTabId, true);
    try {
      const tree = await tauriAPI.loadFileTree(projectPath);
      setFileTree(activeTabId, tree);
    } catch (error) {
      console.error('[FileTree] Failed to load file tree:', error);
      setFileTree(activeTabId, []);
    } finally {
      setLoadingTree(activeTabId, false);
    }
  };

  useEffect(() => {
    if (projectPath && activeTabId) {
      loadFileTree();
    }
  }, [projectPath, activeTabId]);

  // Listen for session ID from Claude CLI
  useEffect(() => {
    let unlisten: any = null;

    listen<string>('chat:session-id', (event) => {
      const sessionId = event.payload;
      console.log('[FileTree] Session ID received from CLI:', sessionId);
      setCurrentSessionId(sessionId);
    }).then(fn => { unlisten = fn; });

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // Close permission dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (permDropdownRef.current && !permDropdownRef.current.contains(event.target as Node)) {
        setIsPermDropdownOpen(false);
      }
    };

    if (isPermDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPermDropdownOpen]);

  // Close model dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };

    if (isModelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModelDropdownOpen]);

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
    } catch (error) {
      alert(`Failed to rename: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setContextMenu(null);
    }
  };

  const handleInsertReference = (reference: string) => {
    console.log('[FileTree] Insert reference requested:', reference);
    setDraggedFile(reference);
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

  const currentPermDisplay = PERMISSION_MODE_DISPLAYS[permissionMode];
  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  return (
    <div className="flex flex-col h-full">
      {/* Tab Controls: Permissions & Model */}
      <div className="flex-shrink-0 px-2 pt-2 pb-1 border-b" style={{ borderColor: 'var(--theme-border)' }}>
        {/* Permissions Dropdown */}
        <div className="relative mb-2" ref={permDropdownRef}>
          <button
            onClick={() => setIsPermDropdownOpen(!isPermDropdownOpen)}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors"
            style={{
              backgroundColor: 'transparent',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--theme-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            title={currentPermDisplay.description}
          >
            <span>{currentPermDisplay.text}</span>
            <span className="text-xs" style={{ opacity: 0.6 }}>
              {isPermDropdownOpen ? '▲' : '▼'}
            </span>
          </button>

          {/* Permissions Dropdown Menu */}
          {isPermDropdownOpen && (
            <div
              className="absolute left-0 right-0 mt-1 rounded border shadow-lg z-50 overflow-hidden"
              style={{
                backgroundColor: 'var(--theme-bg)',
                borderColor: 'var(--theme-border)'
              }}
            >
              <div className="py-0.5">
                {(Object.keys(PERMISSION_MODE_DISPLAYS) as PermissionMode[]).map((mode) => {
                  const display = PERMISSION_MODE_DISPLAYS[mode];
                  const isSelected = permissionMode === mode;

                  return (
                    <button
                      key={mode}
                      onClick={() => setPermissionMode(mode)}
                      className="w-full px-2 py-1.5 text-left transition-all flex items-start gap-2"
                      style={{
                        backgroundColor: isSelected ? 'var(--theme-accent)' : 'transparent',
                        color: isSelected ? '#FFFFFF' : 'var(--theme-text)',
                        borderLeft: isSelected ? '3px solid var(--theme-accentHover)' : '3px solid transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'var(--theme-hover)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-medium text-xs">
                            {display.text}
                          </span>
                          {isSelected && (
                            <span className="text-xs">✓</span>
                          )}
                        </div>
                        <p className="text-xs leading-tight" style={{
                          color: isSelected ? 'rgba(255, 255, 255, 0.8)' : 'var(--theme-textSecondary)'
                        }}>
                          {display.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Model Dropdown */}
        <div className="relative mb-2" ref={modelDropdownRef}>
          <button
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors"
            style={{
              backgroundColor: 'transparent',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)'
            }}
            title="Select Claude model"
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--theme-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <span>{currentModel.name}</span>
            <span className="text-xs" style={{ opacity: 0.6 }}>
              {isModelDropdownOpen ? '▲' : '▼'}
            </span>
          </button>

          {/* Model Dropdown Menu */}
          {isModelDropdownOpen && (
            <div
              className="absolute left-0 right-0 mt-1 rounded border shadow-lg z-50 overflow-hidden"
              style={{
                backgroundColor: 'var(--theme-bg)',
                borderColor: 'var(--theme-border)'
              }}
            >
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    // Update global default model in settings
                    setSelectedModel(model.id);
                    // Update the active tab's model
                    if (activeTabId) {
                      updateTab(activeTabId, { selectedModel: model.id });
                    }
                    setIsModelDropdownOpen(false);
                  }}
                  className="w-full px-2 py-1.5 text-left transition-colors flex items-center justify-between text-xs"
                  style={{
                    backgroundColor: selectedModel === model.id ? 'var(--theme-accent)' : 'var(--theme-bg)',
                    color: selectedModel === model.id ? 'white' : 'var(--theme-text)'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedModel !== model.id) {
                      e.currentTarget.style.backgroundColor = 'var(--theme-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedModel !== model.id) {
                      e.currentTarget.style.backgroundColor = 'var(--theme-bg)';
                    }
                  }}
                >
                  <span className="font-medium">{model.name}</span>
                  {selectedModel === model.id && (
                    <span className="text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Session History Link */}
        <div className="relative mb-2 px-2">
          <button
            onClick={() => setShowSessionBrowser(true)}
            className="text-xs font-medium underline cursor-pointer hover:no-underline transition-all"
            style={{
              color: 'var(--theme-text)',
            }}
            title="Browse and manage session history for this project"
          >
            Session History
          </button>
        </div>

        {/* Token Counter Text */}
        {activeTab?.totalTokens !== undefined && activeTab.totalTokens > 0 && (
          <div className="relative mb-2 px-2">
            <div
              className="text-xs flex items-center justify-between"
              style={{
                color: 'var(--theme-textSecondary)',
              }}
              title="Total tokens used in this session"
            >
              <span>Tokens:</span>
              <span className="font-mono font-medium" style={{ color: 'var(--theme-text)' }}>
                {formatTokenCount(activeTab.totalTokens)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Search Header */}
      <div className="flex-shrink-0 p-2 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
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
          <button
            onClick={() => loadFileTree()}
            disabled={isLoadingTree}
            className="flex-shrink-0 px-2 py-2 rounded-lg border transition-colors text-xs font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--theme-bg)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)'
            }}
            onMouseEnter={(e) => { if (!isLoadingTree) e.currentTarget.style.backgroundColor = 'var(--theme-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--theme-bg)'; }}
            title="Refresh file tree"
          >
            <span className={isLoadingTree ? 'animate-spin' : ''}>↻</span>
          </button>
        </div>
      </div>

      {/* Scrollable File Tree */}
      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        {fileTree.map(node => (
          <FileTreeNode
            key={node.path}
            node={node}
            level={0}
            rootPath={projectPath}
            onFileClick={(path, name) => {
              setPreviewFile({ path, name });
            }}
            onFileDoubleClick={(path, name) => {
              const { getActiveTab, openFileTab } = useTabStore.getState();
              const activeTab = getActiveTab();
              if (!activeTab) return;
              if (activeTab.openFileTabs.length >= 5) {
                console.warn('[FileTree] Max 5 file tabs open');
                return;
              }
              openFileTab(activeTab.id, path, name);
            }}
            onContextMenu={handleContextMenu}
            onInsertReference={handleInsertReference}
            searchQuery={searchQuery}
          />
        ))}
      </div>

      {previewFile && (
        <FilePreviewPanel
          filePath={previewFile.path}
          fileName={previewFile.name}
          onClose={() => setPreviewFile(null)}
          onExpand={() => {
            const { getActiveTab, openFileTab } = useTabStore.getState();
            const activeTab = getActiveTab();
            if (!activeTab || !previewFile) return;
            if (activeTab.openFileTabs.length >= 5) {
              console.warn('[FileTree] Max 5 file tabs open');
              return;
            }
            openFileTab(activeTab.id, previewFile.path, previewFile.name);
          }}
        />
      )}

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

      {/* Session Browser Modal */}
      {showSessionBrowser && projectPath && (
        <SessionBrowser
          isOpen={showSessionBrowser}
          onClose={() => setShowSessionBrowser(false)}
          projectPath={projectPath}
          currentSessionId={currentSessionId}
          onLoadSession={(sessionId: string) => {
            console.log('[FileTree] onLoadSession called with sessionId:', sessionId);
            setCurrentSessionId(sessionId);
            setShowSessionBrowser(false);
            // Reset token count when switching sessions (empty or past session)
            if (activeTabId) {
              console.log('[FileTree] Resetting token count for tab:', activeTabId);
              updateTab(activeTabId, { totalTokens: 0 });
            } else {
              console.log('[FileTree] No activeTabId - cannot reset token count');
            }
          }}
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
  onFileDoubleClick?: (path: string, name: string) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
  onInsertReference?: (reference: string) => void;
  searchQuery: string;
}

function FileTreeNode({ node, level, rootPath, onFileClick, onFileDoubleClick, onContextMenu, onInsertReference, searchQuery }: FileTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<FileNode[]>(node.children || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

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
      // Construct absolute path from root + relative path
      const absolutePath = path.join(rootPath, node.path);
      console.log('[FileTree] File clicked:', node.name, 'Relative:', node.path, 'Absolute:', absolutePath);
      onFileClick(absolutePath, node.name);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (node.type === 'file' && onFileDoubleClick) {
      e.preventDefault();
      const absolutePath = path.join(rootPath, node.path);
      onFileDoubleClick(absolutePath, node.name);
    }
  };

  const paddingLeft = level * 16;

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

  const handleInsertClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'file' && onInsertReference) {
      const relativePath = node.path.replace(rootPath, '').replace(/\\/g, '/').replace(/^\//, '');
      console.log('[FileTree] Insert button clicked:', `@${relativePath}`);
      onInsertReference(`@${relativePath}`);
    }
  };

  return (
    <div>
      <div
        className="flex items-center gap-1 px-2 py-1 cursor-pointer rounded text-sm relative transition-colors"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => onContextMenu(e, node)}
        onMouseEnter={(e) => {
          setIsHovering(true);
          e.currentTarget.style.backgroundColor = 'var(--theme-hover)';
        }}
        onMouseLeave={(e) => {
          setIsHovering(false);
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        style={{
          paddingLeft: `${paddingLeft + 8}px`,
          color: 'var(--theme-text)'
        }}
      >
        {node.type === 'directory' ? (
          <>
            <span style={{ color: 'var(--theme-textSecondary)' }}>{isLoading ? '⟳' : isExpanded ? '▼' : '▶'}</span>
            <span>📁</span>
          </>
        ) : (
          <>
            <span className="w-4" />
            <span>📄</span>
          </>
        )}
        <span className="ml-1 flex-1" style={{ color: 'var(--theme-text)' }}>{highlightText(node.name, searchQuery)}</span>
        {node.type === 'file' && isHovering && (
          <button
            onClick={handleInsertClick}
            className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            title="Insert @ reference into chat"
          >
            @
          </button>
        )}
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
              onFileDoubleClick={onFileDoubleClick}
              onContextMenu={onContextMenu}
              onInsertReference={onInsertReference}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}
