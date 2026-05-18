import { useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { checkForUpdatesOnLaunch } from './utils/updater';
import './styles/globals.css';

function App() {
  useEffect(() => {
    // Remove the HTML loading screen once React has mounted
    const loadingElement = document.getElementById('app-loading');
    if (loadingElement) {
      // Small delay to ensure everything is ready
      setTimeout(() => {
        loadingElement.style.opacity = '0';
        loadingElement.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => {
          loadingElement.remove();
        }, 300);
      }, 100);
    }

    // Check for updates on launch (after a short delay)
    setTimeout(() => {
      checkForUpdatesOnLaunch();
    }, 2000);
  }, []);

  return <AppShell />;
}

export default App;
