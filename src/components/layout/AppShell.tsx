import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatInterface } from '../chat/ChatInterface';
import { FileTree } from '../file-tree/FileTree';
import { ApiKeyDialog } from './ApiKeyDialog';
import { ProjectSelectionModal } from './ProjectSelectionModal';
import { CommandsModal } from '../help/CommandsModal';
import { SettingsModal } from '../settings/SettingsModal';
import { SkillsModal } from '../skills/SkillsModal';
import { TabBar } from '../tabs/TabBar';
import { useProjectStore } from '../../stores/projectStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSkillsStore } from '../../stores/skillsStore';
import { useTabStore } from '../../stores/tabStore';
import { tauriAPI } from '../../utils/tauri-api';
import { APP_VERSION } from '../../version';
import { logWithTimestamp } from '../../utils/logger';
import iconImage from '../../assets/icon.png';

const SIDEBAR_MIN = 180;
const SIDEBAR_MAX = 480;
const SIDEBAR_DEFAULT = 256;

logWithTimestamp('[AppShell.tsx] Module loaded');

export function AppShell() {
  logWithTimestamp('[AppShell] Component function called');
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
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [cliError, setCliError] = useState<string | null>(null);
  const [isVerifyingCli, setIsVerifyingCli] = useState(false);
  const { projectPath, selectProject } = useProjectStore();
  const { assistantName, loadSettings } = useSettingsStore();
  const { loadCustomSkills } = useSkillsStore();
  const { loadTabs } = useTabStore();

  // Load settings on mount
  useEffect(() => {
    logWithTimestamp('[AppShell] useEffect: loadSettings starting');
    loadSettings();
    logWithTimestamp('[AppShell] useEffect: loadSettings complete');
  }, [loadSettings]);

  // Load custom skills on mount
  useEffect(() => {
    logWithTimestamp('[AppShell] Loading custom skills');
    loadCustomSkills();
  }, [loadCustomSkills]);

  // Load tabs from localStorage on mount
  useEffect(() => {
    logWithTimestamp('[AppShell] Loading tabs');
    loadTabs();
  }, [loadTabs]);

  // Check Claude CLI installation and authentication (first launch only, after project selection)
  useEffect(() => {
    // Skip if already verified in a previous session
    const isVerified = localStorage.getItem('cliVerified') === 'true';
    if (isVerified) {
      logWithTimestamp('[AppShell] CLI already verified, skipping check');
      return;
    }

    // Only check after user has selected a project
    if (!projectPath) {
      logWithTimestamp('[AppShell] No project selected yet, deferring CLI check');
      return;
    }

    logWithTimestamp('[AppShell] First launch with project - checking CLI');
    const checkCli = async () => {
      setIsVerifyingCli(true);
      try {
        logWithTimestamp('[AppShell] Calling tauriAPI.checkClaudeCli()');
        const result = await tauriAPI.checkClaudeCli();
        logWithTimestamp('[AppShell] checkClaudeCli returned:', result);

        if (!result.installed || !result.authenticated) {
          setCliError(result.error || 'Claude CLI setup issue');
        } else {
          // Mark as verified for future launches
          localStorage.setItem('cliVerified', 'true');
          logWithTimestamp('[AppShell] CLI verified and cached');
        }
      } catch (error) {
        console.error('Failed to check Claude CLI:', error);
        setCliError('Failed to check Claude CLI status');
      } finally {
        setIsVerifyingCli(false);
      }
    };
    checkCli();
  }, [projectPath]); // Re-run when projectPath changes

  // API key check not needed for Tauri - always uses CLI
  // (keeping empty useEffect structure for consistency)
  useEffect(() => {
    // Tauri always uses CLI auth, no API key dialog needed
  }, []);

  // Show project selection modal only if no tabs exist
  // Use selector to ensure we subscribe to tab changes
  const tabs = useTabStore(state => state.tabs);
  useEffect(() => {
    console.log('[AppShell] Tab count changed:', tabs.length);
    // Only show project modal if we have no tabs at all
    if (tabs.length === 0 && !showApiKeyDialog) {
      console.log('[AppShell] No tabs - showing project modal');
      setShowProjectModal(true);
    } else {
      console.log('[AppShell] Have tabs - hiding project modal');
      setShowProjectModal(false);
    }
  }, [tabs.length, showApiKeyDialog]);

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
    const { addTab, canAddTab } = useTabStore.getState();

    // Select a project folder
    await selectProject();

    // Get the selected project path
    const selectedPath = useProjectStore.getState().projectPath;

    // If a project was selected and we can add a tab, create one
    if (selectedPath && canAddTab()) {
      console.log('[AppShell] Creating tab for selected project:', selectedPath);
      addTab(selectedPath);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const { tabs, activeTabId, switchTab, addTab, removeTab, canAddTab } = useTabStore.getState();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Help modal: Ctrl+/ or Cmd+/
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowCommandsModal(prev => !prev);
        return;
      }

      // New tab: Ctrl+T or Cmd+T
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        if (canAddTab()) {
          console.log('[AppShell] Keyboard shortcut: New tab');
          // Trigger folder picker using tauriAPI directly
          tauriAPI.selectProject().then((result) => {
            if (result) {
              addTab(result);
            }
          }).catch(err => {
            console.error('[AppShell] Failed to select project:', err);
          });
        }
        return;
      }

      // Close tab: Ctrl+W or Cmd+W
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        if (activeTabId) {
          console.log('[AppShell] Keyboard shortcut: Close tab');
          removeTab(activeTabId);
        }
        return;
      }

      // Next tab: Ctrl+Tab
      if (e.ctrlKey && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const currentIndex = tabs.findIndex(t => t.id === activeTabId);
        if (currentIndex !== -1) {
          const nextIndex = (currentIndex + 1) % tabs.length;
          console.log('[AppShell] Keyboard shortcut: Next tab');
          switchTab(tabs[nextIndex].id);
        }
        return;
      }

      // Previous tab: Ctrl+Shift+Tab
      if (e.ctrlKey && e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        const currentIndex = tabs.findIndex(t => t.id === activeTabId);
        if (currentIndex !== -1) {
          const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          console.log('[AppShell] Keyboard shortcut: Previous tab');
          switchTab(tabs[prevIndex].id);
        }
        return;
      }

      // Tab by number: Ctrl+1 through Ctrl+6
      if (e.ctrlKey && e.key >= '1' && e.key <= '6') {
        e.preventDefault();
        const index = parseInt(e.key, 10) - 1;
        if (index < tabs.length) {
          console.log('[AppShell] Keyboard shortcut: Switch to tab', index + 1);
          switchTab(tabs[index].id);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty deps - we use getState() to get fresh data

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
      <SkillsModal isOpen={showSkillsModal} onClose={() => setShowSkillsModal(false)} />

      {/* CLI Verification Loading Overlay (first launch only) */}
      {isVerifyingCli && (
        <div
          id="cli-verification-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--theme-bg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <img
            src={iconImage}
            alt="Claude Cozy"
            style={{ width: '80px', height: '80px', marginBottom: '20px' }}
          />
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--theme-text)',
            marginBottom: '8px'
          }}>
            Verifying Claude CLI...
          </div>
          <div style={{
            fontSize: '14px',
            color: 'var(--theme-textSecondary)'
          }}>
            This only happens once
          </div>
        </div>
      )}

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

              {/* Workspace Label */}
              <div className="px-4 py-2 border-b flex-shrink-0" style={{ borderColor: 'var(--theme-border)' }}>
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
              onClick={() => setShowSkillsModal(true)}
              className="px-3 py-1.5 rounded-lg border transition-colors text-xs font-medium flex items-center gap-1.5"
              style={{
                backgroundColor: 'rgba(147, 51, 234, 0.1)',
                borderColor: 'rgb(147, 51, 234)',
                color: 'rgb(107, 33, 168)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(147, 51, 234, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(147, 51, 234, 0.1)';
              }}
              title="Manage custom skills"
            >
              <span>🛠️</span>
              <span>Skills</span>
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

        {/* Tab Bar - Full Width */}
        <TabBar />

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
