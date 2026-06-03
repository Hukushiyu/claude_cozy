import { useEffect, useState } from 'react';
import { tauriAPI } from '../../utils/tauri-api';
import type { SessionInfo } from '../../types/ipc';
import { ask } from '@tauri-apps/plugin-dialog';

interface SessionBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  projectPath: string;
  currentSessionId?: string;
  onLoadSession: (sessionId: string) => void;
}

export function SessionBrowser({ isOpen, onClose, projectPath, currentSessionId, onLoadSession }: SessionBrowserProps) {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && projectPath) {
      loadSessions();
    }
  }, [isOpen, projectPath]);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const sessionList = await tauriAPI.listSessions(projectPath);
      setSessions(sessionList);
    } catch (err) {
      setError(String(err));
      console.error('[SessionBrowser] Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSession = async (sessionId: string) => {
    try {
      onLoadSession(sessionId);
      onClose();
    } catch (err) {
      setError(String(err));
      console.error('[SessionBrowser] Failed to load session:', err);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering load

    const isCurrentSession = sessionId === currentSessionId;
    const confirmMessage = isCurrentSession
      ? `This is your currently active session. Deleting it will clear your chat history.\n\nAre you sure you want to delete this session?`
      : `Are you sure you want to delete this session?\n\nThis action cannot be undone.`;

    const confirmed = await ask(confirmMessage, {
      title: 'Delete Session?',
      kind: 'warning',
      okLabel: 'Delete',
      cancelLabel: 'Cancel'
    });

    if (!confirmed) {
      console.log('[SessionBrowser] Delete cancelled by user');
      return;
    }

    console.log('[SessionBrowser] Deleting session:', sessionId, 'isCurrentSession:', isCurrentSession);

    try {
      await tauriAPI.deleteSession(projectPath, sessionId);
      console.log('[SessionBrowser] Session deleted successfully');
      await loadSessions(); // Refresh list

      if (isCurrentSession) {
        // If we deleted the current session, reload to show empty state
        console.log('[SessionBrowser] Calling onLoadSession("") to reset after deleting current session');
        onLoadSession(''); // Empty string triggers fresh start
      }
    } catch (err) {
      setError(String(err));
      console.error('[SessionBrowser] Failed to delete session:', err);
    }
  };

  const handleDeleteAllSessions = async () => {
    const confirmed = await ask(
      `⚠️ WARNING: This will permanently delete ALL conversation sessions for this project.\n\nThis includes:\n• All ${sessions.length} session${sessions.length !== 1 ? 's' : ''}\n• All conversation history\n• This cannot be undone\n\nAre you absolutely sure you want to continue?`,
      {
        title: 'Delete All Sessions?',
        kind: 'warning',
        okLabel: 'Delete All',
        cancelLabel: 'Cancel'
      }
    );

    if (!confirmed) return;

    try {
      await tauriAPI.clearHistory(projectPath);
      await loadSessions(); // Refresh list (should be empty now)

      // Clear current chat UI
      onLoadSession('');
      onClose();
    } catch (err) {
      setError(String(err));
      console.error('[SessionBrowser] Failed to clear all sessions:', err);
    }
  };

  const formatDate = (timestamp: string) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  const formatDateRange = (first: string, last: string) => {
    const firstDate = formatDate(first);
    const lastDate = formatDate(last);

    if (firstDate === lastDate) {
      return firstDate;
    }

    return `${firstDate} → ${lastDate}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="rounded-lg shadow-2xl w-[700px] max-h-[80vh] overflow-hidden flex flex-col"
        style={{ backgroundColor: 'var(--theme-bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex justify-between items-center flex-shrink-0"
          style={{ backgroundColor: 'var(--theme-accent)', color: '#FFFFFF' }}
        >
          <h2 className="text-xl font-semibold">Session History</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading && (
            <div className="text-center py-8" style={{ color: 'var(--theme-textSecondary)' }}>
              Loading sessions...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {!loading && sessions.length === 0 && (
            <div className="text-center py-12" style={{ color: 'var(--theme-textSecondary)' }}>
              <div className="text-4xl mb-3">📋</div>
              <p className="text-lg mb-1" style={{ color: 'var(--theme-text)' }}>No sessions yet</p>
              <p className="text-sm">Start a conversation to create your first session</p>
            </div>
          )}

          {!loading && sessions.length > 0 && (
            <div className="space-y-3">
              {sessions.map((session) => {
                const isActive = session.session_id === currentSessionId;

                return (
                  <div
                    key={session.session_id}
                    className="border rounded-lg p-4 transition-all cursor-pointer"
                    style={{
                      borderColor: isActive ? 'var(--theme-accent)' : 'var(--theme-border)',
                      backgroundColor: isActive ? 'var(--theme-hover)' : 'transparent',
                    }}
                    onClick={() => handleLoadSession(session.session_id)}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'var(--theme-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs px-2 py-0.5 rounded" style={{
                            backgroundColor: 'var(--theme-accent)',
                            color: '#FFFFFF',
                            opacity: 0.8
                          }}>
                            {session.session_id.substring(0, 8)}
                          </span>
                          {isActive && (
                            <span className="text-xs px-2 py-0.5 rounded" style={{
                              backgroundColor: 'var(--theme-accent)',
                              color: '#FFFFFF'
                            }}>
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-sm" style={{ color: 'var(--theme-textSecondary)' }}>
                          {formatDateRange(session.first_timestamp, session.last_timestamp)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(session.session_id, e)}
                        className="px-3 py-1 rounded text-sm transition-colors"
                        style={{
                          backgroundColor: 'transparent',
                          color: 'var(--theme-textSecondary)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#EF4444';
                          e.currentTarget.style.color = '#FFFFFF';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--theme-textSecondary)';
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                    <div className="text-sm" style={{ color: 'var(--theme-text)' }}>
                      <span className="font-medium">{session.message_count}</span> messages
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="border-t px-6 py-3 flex justify-between items-center flex-shrink-0"
          style={{
            borderColor: 'var(--theme-border)',
            backgroundColor: 'var(--theme-hover)'
          }}
        >
          <div className="flex items-center gap-3">
            <p className="text-xs" style={{ color: 'var(--theme-textSecondary)' }}>
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} found
            </p>
            {sessions.length > 0 && (
              <button
                onClick={handleDeleteAllSessions}
                className="px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgb(239, 68, 68)',
                  color: 'rgb(185, 28, 28)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                }}
              >
                <span>🗑️</span>
                <span>Delete All</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded transition-opacity"
            style={{
              backgroundColor: 'var(--theme-accent)',
              color: '#FFFFFF'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--theme-accentHover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--theme-accent)';
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
