import { useState, useEffect } from 'react';
import { tauriAPI } from '../../utils/tauri-api';
import type { UnlistenFn } from '@tauri-apps/api/event';
import { ask } from '@tauri-apps/plugin-dialog';

export function PermissionStatusButton() {
  const [permissionsApproved, setPermissionsApproved] = useState(false);

  useEffect(() => {
    // Clear any old localStorage keys from previous versions
    localStorage.removeItem('toolPermissionsApproved');

    // Check localStorage ONLY for manual approval setting
    const syncPermissionState = async () => {
      const stored = localStorage.getItem('manualPermissionApproval');
      const manuallyApproved = stored === 'true';

      console.log('[PermissionStatusButton] Stored manual approval:', stored);
      console.log('[PermissionStatusButton] Manual approval flag:', manuallyApproved);

      if (manuallyApproved) {
        // User manually approved via button - restore that state
        console.log('[PermissionStatusButton] Restoring manual approval state');
        await tauriAPI.approvePermissions(false); // persistent approval
        setPermissionsApproved(true);
      } else {
        // Default to NOT approved
        console.log('[PermissionStatusButton] Defaulting to NOT approved');
        await tauriAPI.resetPermissions();
        setPermissionsApproved(false);
      }
    };

    syncPermissionState();

    let unlistenApproval: UnlistenFn | null = null;
    let unlistenReset: UnlistenFn | null = null;

    // Listen for custom approval event from ChatInterface
    const handleTemporaryApproval = () => {
      console.log('[PermissionStatusButton] Temporary approval event received');
      setPermissionsApproved(true);
    };

    window.addEventListener('permissions-approved-temporarily', handleTemporaryApproval);

    // Listen for permission changes
    const setupListeners = async () => {
      unlistenApproval = await tauriAPI.onPermissionRequest(() => {
        // This fires when permission is REQUESTED (before approval)
        // Don't change button state here
        console.log('[PermissionStatusButton] Permission requested');
      });

      unlistenReset = await tauriAPI.onPermissionReset(() => {
        console.log('[PermissionStatusButton] Permission reset event');
        setPermissionsApproved(false);
      });
    };

    setupListeners();

    // Don't poll - rely on event listeners and manual state management
    // The polling was causing the button to flip back

    return () => {
      window.removeEventListener('permissions-approved-temporarily', handleTemporaryApproval);
      if (unlistenApproval) unlistenApproval();
      if (unlistenReset) unlistenReset();
    };
  }, []);

  const handleReset = async () => {
    const confirmed = await ask(
      'You will be prompted to approve tools again on the next request.',
      {
        title: 'Reset tool permissions?',
        kind: 'warning',
        okLabel: 'Reset',
        cancelLabel: 'Cancel'
      }
    );

    if (confirmed) {
      try {
        console.log('[PermissionStatusButton] User confirmed reset');
        await tauriAPI.resetPermissions();
        localStorage.removeItem('manualPermissionApproval'); // Remove manual approval flag
        console.log('[PermissionStatusButton] Removed manualPermissionApproval from localStorage');
        setPermissionsApproved(false);
      } catch (error) {
        console.error('Failed to reset permissions:', error);
        await ask('Failed to reset permissions. Please try again.', {
          title: 'Error',
          kind: 'error',
          okLabel: 'OK'
        });
      }
    }
  };

  const handleManualApprove = async () => {
    // User manually clicked to approve - persist this choice
    try {
      console.log('[PermissionStatusButton] User manually approved via button');
      await tauriAPI.approvePermissions(false); // temporary = false (persistent approval)
      localStorage.setItem('manualPermissionApproval', 'true');
      console.log('[PermissionStatusButton] Saved manualPermissionApproval=true to localStorage');
      setPermissionsApproved(true);
    } catch (error) {
      console.error('Failed to approve permissions:', error);
    }
  };

  return (
    <button
      onClick={permissionsApproved ? handleReset : handleManualApprove}
      disabled={false}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium"
      style={{
        backgroundColor: permissionsApproved ? 'rgba(34, 197, 94, 0.1)' : 'rgba(156, 163, 175, 0.1)',
        borderColor: permissionsApproved ? 'rgb(34, 197, 94)' : 'rgb(156, 163, 175)',
        color: permissionsApproved ? 'rgb(21, 128, 61)' : 'rgb(107, 114, 128)'
      }}
      onMouseEnter={(e) => {
        if (permissionsApproved) {
          e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = permissionsApproved ? 'rgba(34, 197, 94, 0.1)' : 'rgba(156, 163, 175, 0.1)';
      }}
      title={
        permissionsApproved
          ? 'Tools approved - Click to reset and require permission again'
          : 'Tool permissions not approved yet - You will be prompted when Claude needs to use tools (Read, Write, Edit, Bash, etc.)'
      }
    >
      <div
        className="w-2 h-2 rounded-full"
        style={{
          backgroundColor: permissionsApproved ? 'rgb(34, 197, 94)' : 'rgb(156, 163, 175)'
        }}
      />
      <span>
        {permissionsApproved ? 'Tools Approved' : 'Will Prompt'}
      </span>
    </button>
  );
}
