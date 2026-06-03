import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useTabStore } from '../../stores/tabStore';
import { MessageList } from './MessageList';
import { InputArea, InputAreaHandle } from './InputArea';
import { PermissionModal } from './PermissionModal';
import { tauriAPI } from '../../utils/tauri-api';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { ask } from '@tauri-apps/plugin-dialog';

interface PermissionRequest {
  requestId: string;  // NEW: Required for control_response
  toolName: string;
  input: string;
}

export function ChatInterface() {
  const { activeTabId, getActiveTab } = useTabStore();
  const activeTab = getActiveTab();
  const projectPath = activeTab?.projectPath || null;

  // Single selector for entire tab state - more stable than multiple selectors
  const activeTabState = useChatStore(state => state.tabStates[activeTabId || '']);

  // Destructure with defaults
  const messages = activeTabState?.messages || [];
  const toolEvents = activeTabState?.toolEvents || [];
  const streamingMessage = activeTabState?.streamingMessage || null;
  const isThinking = activeTabState?.isThinking || false;
  const thinkingStatus = activeTabState?.thinkingStatus || null;
  const isLoading = activeTabState?.isLoading || false;
  const error = activeTabState?.error || null;

  // Get methods (these don't need selectors)
  const {
    sendMessage,
    appendChunk,
    appendThought,
    finalizeStream,
    finalizeStreamTurn,
    addToolEvent,
    setThinkingStatus,
    setError,
    clearError,
    loadHistory,
    stopClaude,
    initTabState
  } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<InputAreaHandle>(null);
  const [dismissedWarningCount, setDismissedWarningCount] = useState<number>(0);
  const [permissionRequest, setPermissionRequest] = useState<PermissionRequest | null>(null);

  // Load conversation history when active tab changes
  useEffect(() => {
    if (activeTabId && projectPath) {
      console.log('[ChatInterface] Active tab changed, initializing/loading history');
      // Initialize tab state if not exists
      initTabState(activeTabId);
      // Load history
      loadHistory();
    }
  }, [activeTabId, projectPath, initTabState, loadHistory]);

  // Auto-scroll to bottom when new messages, tool events, or permission request arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, toolEvents, streamingMessage, permissionRequest]);

  // Escape key handler to stop Claude
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      // Only stop if Claude is thinking/loading and not waiting for permission
      if (e.key === 'Escape' && (isThinking || isLoading) && !permissionRequest) {
        console.log('[ChatInterface] Escape pressed - stopping Claude');
        stopClaude();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isThinking, isLoading, permissionRequest, stopClaude]);

  // Set up ALL event listeners once on mount
  useEffect(() => {
    console.log('Setting up all chat event listeners');
    let cancelled = false;

    let unlistenChunk: UnlistenFn | null = null;
    let unlistenComplete: UnlistenFn | null = null;
    let unlistenTurnComplete: UnlistenFn | null = null;
    let unlistenError: UnlistenFn | null = null;
    let unlistenTool: UnlistenFn | null = null;
    let unlistenThinking: UnlistenFn | null = null;
    let unlistenThought: UnlistenFn | null = null;
    let unlistenPermission: UnlistenFn | null = null;

    // Set up all listeners asynchronously
    const setupListeners = async () => {
      if (cancelled) return;

      unlistenChunk = await tauriAPI.onMessageChunk((chunk) => {
        console.log('[ChatInterface] Received chunk:', chunk.substring(0, 50));
        appendChunk(chunk);
      });

      if (cancelled) { unlistenChunk(); return; }

      unlistenComplete = await tauriAPI.onMessageComplete((inputTokens, outputTokens) => {
        console.log('[ChatInterface] Message complete');
        if (inputTokens !== undefined && outputTokens !== undefined) {
          const totalTokens = inputTokens + outputTokens;
          console.log(`[ChatInterface] Token usage - Input: ${inputTokens}, Output: ${outputTokens}, Total: ${totalTokens}`);
          // Update tab's token count
          const { updateTab } = useTabStore.getState();
          const { activeTabId, getActiveTab } = useTabStore.getState();
          if (activeTabId) {
            const currentTab = getActiveTab();
            const currentTotal = currentTab?.totalTokens || 0;
            updateTab(activeTabId, { totalTokens: currentTotal + totalTokens });
          }
        }
        finalizeStream();
      });

      if (cancelled) { unlistenChunk(); unlistenComplete(); return; }

      unlistenTurnComplete = await listen('chat:turn-complete', () => {
        console.log('[ChatInterface] Turn complete - finalizing bubble');
        finalizeStreamTurn();
      });

      if (cancelled) { unlistenChunk(); unlistenComplete(); unlistenTurnComplete(); return; }

      unlistenError = await tauriAPI.onChatError((error) => {
        console.error('[ChatInterface] Chat error:', error);
        setError(error);
      });

      if (cancelled) { unlistenChunk(); unlistenComplete(); unlistenError(); return; }

      unlistenTool = await tauriAPI.onToolEvent((event) => {
        console.log('[ChatInterface] Tool event:', event);
        addToolEvent(event);
        if (event.status === 'running') {
          setThinkingStatus(`Running ${event.toolName}`);
        }
      });

      if (cancelled) { unlistenChunk(); unlistenComplete(); unlistenError(); unlistenTool(); return; }

      unlistenThinking = await tauriAPI.onThinkingStatus((status) => {
        console.log('[ChatInterface] Thinking status:', status);
        setThinkingStatus(status);
      });

      if (cancelled) { unlistenChunk(); unlistenComplete(); unlistenError(); unlistenTool(); unlistenThinking(); return; }

      unlistenThought = await tauriAPI.onThoughtChunk((text) => {
        console.log('[ChatInterface] Thought block received:', text.substring(0, 50));
        appendThought(text);
      });

      if (cancelled) { unlistenChunk(); unlistenComplete(); unlistenError(); unlistenTool(); unlistenThinking(); unlistenThought(); return; }

      unlistenPermission = await listen<PermissionRequest>('chat:permission-request', (event) => {
        console.log('[ChatInterface] Permission request:', event.payload);
        setPermissionRequest(event.payload);
      });

      if (!cancelled) {
        console.log('[ChatInterface] All listeners registered');
      }
    };

    setupListeners();

    return () => {
      console.log('Cleaning up all event listeners');
      cancelled = true;
      if (unlistenChunk) unlistenChunk();
      if (unlistenComplete) unlistenComplete();
      if (unlistenTurnComplete) unlistenTurnComplete();
      if (unlistenError) unlistenError();
      if (unlistenTool) unlistenTool();
      if (unlistenThinking) unlistenThinking();
      if (unlistenThought) unlistenThought();
      if (unlistenPermission) unlistenPermission();
    };
  }, []); // EMPTY dependencies - only run once on mount

  // Permission handlers
  const handleApprove = async () => {
    if (permissionRequest) {
      console.log('[ChatInterface] Sending permission approval via stdin');

      // Send control_response to CLI via stdin (no restart!)
      await tauriAPI.sendPermissionResponse(
        permissionRequest.requestId,
        true,  // approved
        null   // updated_permissions (future use)
      );

      // Clear permission request UI
      setPermissionRequest(null);

      // NO discardStream() - process continues naturally
      // NO sendMessage() retry - same process resumes
      console.log('[ChatInterface] Permission approved, CLI process will continue execution');
    }
  };

  const handleDeny = async () => {
    if (permissionRequest) {
      console.log('[ChatInterface] Sending permission denial via stdin');

      // Send control_response with "deny" behavior
      await tauriAPI.sendPermissionResponse(
        permissionRequest.requestId,
        false,  // denied
        null    // updated_permissions
      );

      // Clear permission request UI
      setPermissionRequest(null);

      // CLI will return error to Claude, process continues
      console.log('[ChatInterface] Permission denied, CLI will return error and continue');
    }
  };

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  const handleArchiveHistory = async () => {
    const confirmed = await ask(
      'This will save your message history to an archive file and clear the display. ' +
      'Claude will still maintain context from your conversation - only the UI history will be cleared.\n\n' +
      'Continue with archiving?',
      {
        title: 'Archive conversation history?',
        kind: 'info',
        okLabel: 'Archive',
        cancelLabel: 'Cancel'
      }
    );

    if (!confirmed) return;

    if (!projectPath) {
      alert('No project selected');
      return;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      await tauriAPI.archiveHistory(projectPath, `archive-${timestamp}`);
      setDismissedWarningCount(0);
      await ask(
        'Your conversation history has been saved to an archive file and the display has been cleared. ' +
        'Claude will continue to remember your conversation context.',
        {
          title: 'History archived successfully!',
          kind: 'info',
          okLabel: 'OK'
        }
      );
      await loadHistory();
    } catch (error) {
      console.error('Failed to archive history:', error);
      await ask('Failed to archive history. Please try again.', {
        title: 'Error',
        kind: 'error',
        okLabel: 'OK'
      });
      // Ensure loadHistory is called even on error to reset state
      await loadHistory();
    }

    // Wait for React to finish re-rendering, then restore focus
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        console.log('[ChatInterface] Restoring focus after archive');
        inputAreaRef.current?.focus();
      });
    });
  };

  // Calculate assistant message count and determine if warning should show
  const assistantMessageCount = messages.filter(m => m.role === 'assistant').length;
  const shouldShowWarning = assistantMessageCount >= 150;
  const warningThreshold = Math.floor((assistantMessageCount - 150) / 100) * 100 + 150;
  const hasReachedNewThreshold = warningThreshold > dismissedWarningCount;

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: 'var(--theme-bg)' }}>
      {/* Header with message count */}
      {projectPath && messages.length > 0 && (
        <div className="border-b px-6 py-3 flex justify-between items-center" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg)' }}>
          <div className="text-sm" style={{ color: 'var(--theme-textSecondary)' }}>
            {messages.length} message{messages.length !== 1 ? 's' : ''} in conversation
            <span className="ml-2" style={{ opacity: 0.7 }}>
              ({assistantMessageCount} from Claude)
            </span>
          </div>
          {/* Archive/Clear buttons removed due to Electron focus issues - will be added back in Tauri migration */}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-red-600">❌</span>
            <div className="text-sm text-red-800">
              <strong>Error:</strong> {error}
            </div>
          </div>
          <button
            onClick={clearError}
            className="text-sm text-red-700 hover:text-red-800 px-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Warning banner for large history */}
      {projectPath && shouldShowWarning && hasReachedNewThreshold && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">⚠️</span>
            <div className="text-sm text-yellow-800">
              Your conversation has <strong>{assistantMessageCount} messages from Claude</strong>.
              Large histories may affect performance. Consider archiving older messages.
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleArchiveHistory}
              className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
            >
              Archive Now
            </button>
            <button
              onClick={() => setDismissedWarningCount(warningThreshold)}
              className="text-sm text-yellow-700 hover:text-yellow-800 px-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {messages.length === 0 && !streamingMessage && projectPath && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center" style={{ color: 'var(--theme-textSecondary)' }}>
              <h2 className="text-2xl font-medium mb-2" style={{ color: 'var(--theme-text)' }}>Welcome to Claude Cozy</h2>
              <p>Start a conversation by typing a message below</p>
            </div>
          </div>
        )}

        {!projectPath && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center" style={{ color: 'var(--theme-textSecondary)', opacity: 0.8 }}>
              <div className="text-6xl mb-4">📁</div>
              <h2 className="text-xl font-medium mb-2" style={{ color: 'var(--theme-text)' }}>No Project Selected</h2>
              <p className="text-sm">Select a project folder from the sidebar to start chatting</p>
            </div>
          </div>
        )}

        <MessageList
          messages={messages}
          toolEvents={toolEvents}
          streamingMessage={streamingMessage}
          isThinking={isThinking}
          thinkingStatus={thinkingStatus}
        />

        {/* Permission Request Card - Inline in chat */}
        {permissionRequest && (
          <PermissionModal
            isOpen={true}
            toolName={permissionRequest.toolName}
            description={permissionRequest.input}
            onApprove={handleApprove}
            onDeny={handleDeny}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      <InputArea ref={inputAreaRef} onSend={handleSendMessage} disabled={isLoading || !projectPath} />
    </div>
  );
}
