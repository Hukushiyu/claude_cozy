import { useTabStore } from '../../stores/tabStore';
import { useFileEditorStore } from '../../stores/fileEditorStore';

export function InnerTabBar() {
  const { getActiveTab, setActiveInnerTab, closeFileTab } = useTabStore();
  const { isDirty } = useFileEditorStore();
  const activeTab = getActiveTab();

  if (!activeTab) return null;

  const { openFileTabs, activeInnerTab, id: tabId } = activeTab;

  const handleTabClick = (innerTab: string) => {
    setActiveInnerTab(tabId, innerTab);
  };

  const handleCloseFileTab = (e: React.MouseEvent, filePath: string) => {
    e.stopPropagation();
    // If dirty, the FileEditorPane handles discard confirmation via its own ConfirmDialog
    // when the user triggers close from the editor toolbar. Here we just close directly
    // since this × is a secondary close path — dirty state is visible via ● indicator.
    closeFileTab(tabId, filePath);
  };

  return (
    <div
      className="flex items-end border-b flex-shrink-0 overflow-x-auto"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg)', minHeight: '36px' }}
    >
      {/* Chat tab — always first */}
      <button
        onClick={() => handleTabClick('chat')}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium flex-shrink-0 border-b-2 transition-colors"
        style={{
          borderBottomColor: activeInnerTab === 'chat' ? 'var(--theme-accent)' : 'transparent',
          color: activeInnerTab === 'chat' ? 'var(--theme-accent)' : 'var(--theme-textSecondary)',
          backgroundColor: activeInnerTab === 'chat' ? 'var(--theme-hover)' : 'transparent',
        }}
      >
        Chat
      </button>

      {/* File tabs */}
      {openFileTabs.map((fileTab) => {
        const isActive = activeInnerTab === fileTab.filePath;
        const fileIsDirty = isDirty(fileTab.filePath);

        return (
          <button
            key={fileTab.filePath}
            onClick={() => handleTabClick(fileTab.filePath)}
            className="group flex items-center gap-1 px-3 py-2 text-sm flex-shrink-0 border-b-2 transition-colors max-w-[180px]"
            style={{
              borderBottomColor: isActive ? 'var(--theme-accent)' : 'transparent',
              color: isActive ? 'var(--theme-accent)' : 'var(--theme-textSecondary)',
              backgroundColor: isActive ? 'var(--theme-hover)' : 'transparent',
            }}
            title={fileTab.filePath}
          >
            <span className="truncate max-w-[120px] text-xs">{fileTab.fileName}</span>
            {fileIsDirty && (
              <span className="text-xs flex-shrink-0" style={{ color: 'var(--theme-accent)' }}>●</span>
            )}
            <span
              onClick={(e) => handleCloseFileTab(e, fileTab.filePath)}
              className="flex-shrink-0 text-xs leading-none opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 hover:opacity-70"
              style={{ color: 'var(--theme-textSecondary)' }}
              title="Close"
            >
              ×
            </span>
          </button>
        );
      })}

      {/* Cap indicator */}
      {openFileTabs.length >= 5 && (
        <div
          className="px-3 py-2 text-xs flex-shrink-0"
          style={{ color: 'var(--theme-textSecondary)' }}
          title="Maximum 5 file tabs open"
        >
          5/5
        </div>
      )}
    </div>
  );
}
