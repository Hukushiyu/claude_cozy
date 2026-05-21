import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatInterface } from '../chat/ChatInterface';
import { FileTree } from '../file-tree/FileTree';
import { ApiKeyDialog } from './ApiKeyDialog';
import { ProjectSelectionModal } from './ProjectSelectionModal';
import { CommandsModal } from '../help/CommandsModal';
import { SettingsModal } from '../settings/SettingsModal';
import { ClearHistoryModal } from './ClearHistoryModal';
import { PermissionStatusButton } from './PermissionStatusButton';
import { ModelSelector } from './ModelSelector';
import { useProjectStore } from '../../stores/projectStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { tauriAPI } from '../../utils/tauri-api';
import { APP_VERSION } from '../../version';
import iconImage from '../../assets/icon.png';

const SIDEBAR_MIN = 180;
const SIDEBAR_MAX = 480;
const SIDEBAR_DEFAULT = 256;

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebarWidth');
    return saved ? parseInt(saved, 10) : SIDEBAR_DEFAULT;
  });
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showCommandsModal, setShowCommandsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [cliError, setCliError] = useState<string | null>(null);
  const { projectPath, selectProject, isSelectingProject } = useProjectStore();
  const { assistantName, loadSettings } = useSettingsStore();

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Check Claude CLI installation and authentication on mount
  useEffect(() => {
    const checkCli = async () => {
      try {
        const result = await tauriAPI.checkClaudeCli();
        if (!result.installed || !result.authenticated) {
          setCliError(result.error || 'Claude CLI setup issue');
        }
      } catch (error) {
        console.error('Failed to check Claude CLI:', error);
        setCliError('Failed to check Claude CLI status');
      }
    };
    checkCli();
  }, []);

  // API key check not needed for Tauri - always uses CLI
  // (keeping empty useEffect structure for consistency)
  useEffect(() => {
    // Tauri always uses CLI auth, no API key dialog needed
  }, []);

  // Show project selection modal if no project is selected
  useEffect(() => {
    if (!projectPath && !showApiKeyDialog) {
      setShowProjectModal(true);
    } else {
      setShowProjectModal(false);
    }
  }, [projectPath, showApiKeyDialog]);

  // API key handlers not needed for Tauri
  const handleApiKeySubmit = async (_apiKey: string) => {
    // Not used in Tauri - always CLI auth
    setShowApiKeyDialog(false);
  };

  const handleUseCli = async () => {
    // Not used in Tauri - always CLI auth
    setShowApiKeyDialog(false);
  };

  const handleProjectSelect = async () => {
    await selectProject();
    // Modal will auto-close via useEffect when projectPath changes
  };

  // Keyboard shortcut for help modal: Ctrl+/ or Cmd+/ (toggles open/closed)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+/ or Cmd+/
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowCommandsModal(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Detect if running on Mac
  const isMac = typeof window !== 'undefined' && navigator.platform.toLowerCase().includes('mac');

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = sidebarWidth;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = ev.clientX - dragStartX.current;
      const newWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, dragStartWidth.current + delta));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = (ev: MouseEvent) => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      const delta = ev.clientX - dragStartX.current;
      const finalWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, dragStartWidth.current + delta));
      setSidebarWidth(finalWidth);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [sidebarWidth]);

  // Persist width after drag ends via effect
  useEffect(() => {
    localStorage.setItem('sidebarWidth', String(sidebarWidth));
  }, [sidebarWidth]);

  return (
    <>
      {showApiKeyDialog && <ApiKeyDialog onSubmit={handleApiKeySubmit} onUseCli={handleUseCli} />}
      {showProjectModal && <ProjectSelectionModal onSelectProject={handleProjectSelect} />}
      <CommandsModal isOpen={showCommandsModal} onClose={() => setShowCommandsModal(false)} />
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
      <ClearHistoryModal isOpen={showClearHistoryModal} onClose={() => setShowClearHistoryModal(false)} />

      <div className="flex h-screen overflow-hidden flex-col" style={{ backgroundColor: 'var(--theme-bg)' }}>
        {/* Mac Title Bar - draggable area for traffic lights */}
        {isMac && (
          <div className="h-7 flex-shrink-0 app-drag-region" style={{ backgroundColor: 'var(--theme-bg)' }}>
            {/* Empty space for macOS traffic lights - they overlay at top left */}
          </div>
        )}

        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Sidebar */}
          {sidebarOpen && (
            <div className="flex flex-row h-full flex-shrink-0" style={{ width: sidebarWidth }}>
            <div className="flex-1 border-r flex flex-col h-full overflow-hidden" style={{ backgroundColor: 'var(--theme-sidebarBg)', borderColor: 'var(--theme-border)' }}>
              {/* Logo Section */}
              <div className="p-6 flex flex-col items-center border-b flex-shrink-0 app-drag-region" style={{ borderColor: 'var(--theme-border)' }}>
                <img
                  src={iconImage}
                  alt="Claude Cozy"
                  className="w-16 h-16 mb-3"
                />
                <div className="text-center">
                  <div className="text-sm font-semibold tracking-wider" style={{ color: 'var(--theme-text)' }}>
                    {assistantName.toUpperCase()}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--theme-textSecondary)' }}>
                    v{APP_VERSION}
                  </div>
                </div>
              </div>

              {/* Project Section */}
              <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--theme-border)' }}>
                <div className="text-xs font-semibold mb-2 tracking-wide" style={{ color: 'var(--theme-textSecondary)' }}>
                  PROJECT
                </div>
                <button
                  onClick={selectProject}
                  disabled={isSelectingProject}
                  className="w-full px-4 py-2 text-white rounded transition-opacity text-sm font-medium app-no-drag disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--theme-accent)' }}
                  onMouseEnter={(e) => {
                    if (!isSelectingProject) {
                      e.currentTarget.style.backgroundColor = 'var(--theme-accentHover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--theme-accent)';
                  }}
                >
                  {isSelectingProject ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⏳</span>
                      Opening file picker...
                    </>
                  ) : (
                    'Change Project Folder'
                  )}
                </button>

                {projectPath && (
                  <div className="mt-2 text-xs truncate" style={{ color: 'var(--theme-textSecondary)' }} title={projectPath}>
                    ~{projectPath.split(/[/\\]/).slice(-2).join('/')}
                  </div>
                )}
              </div>

              {/* File Tree Section */}
              <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--theme-border)' }}>
                <div className="text-xs font-semibold tracking-wide" style={{ color: 'var(--theme-textSecondary)' }}>
                  WORKSPACE
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">
                <FileTree />
              </div>
            </div>
            {/* Drag handle */}
            <div
              onMouseDown={handleResizeStart}
              className="w-1 flex-shrink-0 cursor-col-resize hover:bg-blue-400 active:bg-blue-500 transition-colors"
              style={{ backgroundColor: 'transparent' }}
              title="Drag to resize sidebar"
            />
            </div>
          )}

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Header - draggable on Mac */}
        <div className="h-12 border-b flex items-center px-4 flex-shrink-0 app-drag-region" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg)' }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded transition-colors app-no-drag"
            style={{ color: 'var(--theme-text)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--theme-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            ☰
          </button>

          <div className="ml-4 font-medium" style={{ color: 'var(--theme-text)' }}>
            {assistantName} Cozy
          </div>

          {projectPath && !sidebarOpen && (
            <div className="ml-auto text-sm truncate max-w-md" style={{ color: 'var(--theme-textSecondary)' }} title={projectPath}>
              {projectPath}
            </div>
          )}

          <div className="ml-auto flex items-center gap-2 app-no-drag">
            <button
              onClick={() => setShowClearHistoryModal(true)}
              className="px-3 py-1.5 rounded-lg border transition-colors text-xs font-medium flex items-center gap-1.5"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderColor: 'rgb(239, 68, 68)',
                color: 'rgb(185, 28, 28)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              }}
              title="Clear conversation history"
            >
              <span>🗑️</span>
              <span>Clear History</span>
            </button>

            <ModelSelector />

            <PermissionStatusButton />

            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-3 py-1.5 rounded-lg border transition-colors text-xs font-medium flex items-center gap-1.5"
              style={{
                backgroundColor: 'var(--theme-bg)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--theme-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--theme-bg)';
              }}
              title="Settings"
            >
              <span>⚙️</span>
              <span>Settings</span>
            </button>

            <button
              onClick={() => setShowCommandsModal(true)}
              className="px-3 py-1.5 rounded-lg border transition-colors text-xs font-medium flex items-center gap-1.5"
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderColor: 'rgb(59, 130, 246)',
                color: 'rgb(30, 64, 175)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
              }}
              title="View available commands and skills (Ctrl+/)"
            >
              <span>?</span>
              <span>Help</span>
            </button>
          </div>
        </div>

        {/* CLI Error Banner */}
        {cliError && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-start gap-3">
            <span className="text-red-600 text-lg flex-shrink-0">⚠️</span>
            <div className="flex-1 min-w-0">
              <div className="text-red-800 font-medium text-sm">Claude CLI Setup Required</div>
              <div className="text-red-700 text-sm mt-1">{cliError}</div>
              {cliError.includes('not authenticated') && (
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={async () => {
                      const result = await tauriAPI.openTerminalForAuth();
                      if (result.success) {
                        alert('Terminal opened!\n\n1. The command "claude auth login" has been copied to your clipboard\n2. Paste it in the terminal (Ctrl+V or Cmd+V) and press Enter\n3. Follow the login prompts\n4. Restart this app when complete');
                      } else {
                        alert(`Failed to open terminal: ${result.error}\n\nPlease manually open your terminal and run: claude auth login`);
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                  >
                    🖥️ Open Terminal & Login
                  </button>
                  <div className="text-red-700 text-xs">
                    This will open your terminal with login instructions
                  </div>
                </div>
              )}
              {cliError.includes('not installed') && (
                <div className="text-red-700 text-xs mt-2">
                  Download from: <a href="https://claude.ai/download" className="underline font-medium">https://claude.ai/download</a>
                </div>
              )}
            </div>
            <button
              onClick={() => setCliError(null)}
              className="text-red-600 hover:text-red-800 font-bold flex-shrink-0"
              title="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {/* Chat */}
        <div className="flex-1 min-h-0">
          <ChatInterface />
        </div>
      </div>
        </div>
      </div>
    </>
  );
}
