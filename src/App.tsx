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
      const startTime = performance.now();

      try {
        // Update status: Checking for updates
        if (statusEl) statusEl.textContent = 'Checking for updates...';
        logWithTimestamp('[App] About to check for updates');

        // Check for updates FIRST (before showing project selection)
        await checkForUpdatesOnLaunch();
        logWithTimestamp('[App] Update check complete');

        // Update status: Loading app
        if (statusEl) statusEl.textContent = 'Loading workspace...';

        // Ensure splash shows for minimum 2.5 seconds
        const elapsed = performance.now() - startTime;
        const remainingTime = Math.max(0, 2500 - elapsed);

        if (remainingTime > 0) {
          logWithTimestamp(`[App] Waiting ${remainingTime.toFixed(0)}ms to reach 2.5s minimum splash time`);
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        logWithTimestamp('[App] Minimum splash time complete');

        // Mark as ready
        setIsReady(true);
        logWithTimestamp('[App] setIsReady(true) called');

        // Remove the splash screen with fade out
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
