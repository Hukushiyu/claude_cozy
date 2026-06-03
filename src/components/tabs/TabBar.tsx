import { useState } from 'react';
import { useTabStore } from '../../stores/tabStore';
import { tauriAPI } from '../../utils/tauri-api';
import { TabContextMenu } from './TabContextMenu';

export function TabBar() {
  const { tabs, activeTabId, switchTab, removeTab, addTab, canAddTab, updateTab } = useTabStore();
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    tabId: string;
  } | null>(null);

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    removeTab(tabId);
  };

  const handleAddTab = async () => {
    try {
      console.log('[TabBar] Opening folder picker for new tab');
      const result = await tauriAPI.selectProject();

      if (result) {
        console.log('[TabBar] Selected folder:', result);
        // Add tab with default settings
        const newTabId = addTab(result);
        console.log('[TabBar] Created tab:', newTabId);
      } else {
        console.log('[TabBar] Folder picker cancelled');
      }
    } catch (error) {
      console.error('[TabBar] Failed to add tab:', error);
      alert(`Failed to add tab: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      tabId
    });
  };

  const handleChangeProject = async () => {
    if (!contextMenu) return;

    try {
      const result = await tauriAPI.selectProject();
      if (result) {
        // Update the tab's project path
        const pathParts = result.replace(/\\/g, '/').split('/');
        const displayName = pathParts[pathParts.length - 1] || 'Untitled';

        updateTab(contextMenu.tabId, {
          projectPath: result,
          displayName,
          sessionId: null // Reset session when changing project
        });

        console.log('[TabBar] Updated tab project:', contextMenu.tabId, result);
      }
    } catch (error) {
      console.error('[TabBar] Failed to change project:', error);
      alert(`Failed to change project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCloseOtherTabs = () => {
    if (!contextMenu) return;

    tabs.forEach(tab => {
      if (tab.id !== contextMenu.tabId) {
        removeTab(tab.id);
      }
    });
  };

  return (
    <div
      className="h-10 border-b flex items-center px-4 gap-2 overflow-x-auto flex-shrink-0 app-drag-region"
      style={{
        borderColor: 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg)'
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;

        return (
          <div
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            onContextMenu={(e) => handleContextMenu(e, tab.id)}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-t border-t border-l border-r transition-all cursor-pointer flex-shrink-0 app-no-drag"
            style={{
              backgroundColor: isActive ? 'var(--theme-bg)' : 'transparent',
              borderColor: isActive ? 'var(--theme-border)' : 'transparent',
              color: isActive ? 'var(--theme-text)' : 'var(--theme-textSecondary)',
              borderBottom: isActive ? '2px solid var(--theme-accent)' : 'none',
              maxWidth: '200px',
              minWidth: '120px'
            }}
            title={tab.projectPath}
          >
            <span className="text-xs font-medium truncate flex-1">
              {tab.displayName}
            </span>

            {/* Close button - always show on hover or if active */}
            <button
              onClick={(e) => handleCloseTab(e, tab.id)}
              className="flex-shrink-0 w-4 h-4 rounded hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center text-xs opacity-0 group-hover:opacity-100"
              style={{
                opacity: isActive ? 1 : undefined,
                color: isActive ? 'var(--theme-text)' : 'var(--theme-textSecondary)'
              }}
              title="Close tab"
            >
              ×
            </button>
          </div>
        );
      })}

      {/* Add Tab Button */}
      {canAddTab() && (
        <button
          onClick={handleAddTab}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-gray-200 transition-colors flex-shrink-0 app-no-drag"
          style={{ color: 'var(--theme-textSecondary)' }}
          title={`Add new tab (${tabs.length}/6)`}
        >
          <span className="text-lg font-bold">+</span>
          <span className="text-xs font-medium">Add Tab</span>
        </button>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <TabContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onChangeProject={handleChangeProject}
          onCloseTab={() => removeTab(contextMenu.tabId)}
          onCloseOtherTabs={handleCloseOtherTabs}
          isOnlyTab={false}
        />
      )}
    </div>
  );
}
