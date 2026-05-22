import { useEffect, useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { checkForUpdatesOnLaunch } from './utils/updater';
import './styles/globals.css';

function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const statusEl = document.getElementById('loading-status');

      try {
        // Update status: Checking for updates
        if (statusEl) statusEl.textContent = 'Checking for updates...';

        // Check for updates FIRST (before showing project selection)
        await checkForUpdatesOnLaunch();

        // Update status: Loading app
        if (statusEl) statusEl.textContent = 'Loading workspace...';

        // Small delay to ensure everything is settled
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mark as ready
        setIsReady(true);

        // Remove the splash screen
        const loadingElement = document.getElementById('app-loading');
        if (loadingElement) {
          loadingElement.style.opacity = '0';
          loadingElement.style.transition = 'opacity 0.3s ease-out';
          setTimeout(() => {
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
    return null;
  }

  return <AppShell />;
}

export default App;
