import { useEffect, useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { checkForUpdatesOnLaunch } from './utils/updater';
import { logWithTimestamp } from './utils/logger';
import './styles/globals.css';

logWithTimestamp('[App.tsx] Module loaded');

function App() {
  logWithTimestamp('[App] Component function called');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    logWithTimestamp('[App] useEffect running - starting init');
    const init = async () => {
      const statusEl = document.getElementById('loading-status');

      try {
        // Update status: Checking for updates
        if (statusEl) statusEl.textContent = 'Checking for updates...';
        logWithTimestamp('[App] About to check for updates');

        // Check for updates FIRST (before showing project selection)
        await checkForUpdatesOnLaunch();
        logWithTimestamp('[App] Update check complete');

        // Update status: Loading app
        if (statusEl) statusEl.textContent = 'Loading workspace...';

        // Small delay to ensure everything is settled
        await new Promise(resolve => setTimeout(resolve, 500));
        logWithTimestamp('[App] 500ms delay complete');

        // Mark as ready
        setIsReady(true);
        logWithTimestamp('[App] setIsReady(true) called');

        // Remove the splash screen
        const loadingElement = document.getElementById('app-loading');
        if (loadingElement) {
          loadingElement.style.opacity = '0';
          loadingElement.style.transition = 'opacity 0.3s ease-out';
          setTimeout(() => {
            logWithTimestamp('[App] Removing splash screen element');
            loadingElement.remove();
          }, 300);
        }
      } catch (error) {
        console.error('[Init] Startup failed:', error);
        // Still show the app even if update check fails
        setIsReady(true);

        const loadingElement = document.getElementById('app-loading');
        if (loadingElement) {
          loadingElement.style.opacity = '0';
          setTimeout(() => loadingElement.remove(), 300);
        }
      }
    };

    init();
  }, []);

  // Don't render AppShell until initialization is complete
  if (!isReady) {
    logWithTimestamp('[App] Render: not ready yet, returning null');
    return null;
  }

  logWithTimestamp('[App] Render: ready, returning AppShell');
  return <AppShell />;
}

export default App;
