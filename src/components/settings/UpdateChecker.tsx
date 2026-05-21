import { useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { APP_VERSION } from '../../version';

export function UpdateChecker() {
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{ version: string; date: string; body: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const checkForUpdates = async () => {
    setChecking(true);
    setError(null);

    try {
      console.log('[Updater] Checking for updates...');
      const update = await check();

      if (update) {
        console.log(`[Updater] Update available: ${update.version}`);
        setUpdateAvailable(true);
        setUpdateInfo({
          version: update.version,
          date: update.date || 'Unknown',
          body: update.body || 'No release notes available'
        });
      } else {
        console.log('[Updater] Already on latest version');
        setUpdateAvailable(false);
        setUpdateInfo(null);
      }
    } catch (err) {
      console.error('[Updater] Check failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to check for updates');
    } finally {
      setChecking(false);
    }
  };

  const downloadAndInstall = async () => {
    if (!updateInfo) return;

    setDownloading(true);
    setError(null);

    try {
      console.log('[Updater] Downloading and installing update...');
      const update = await check();

      if (update) {
        await update.downloadAndInstall();
        console.log('[Updater] Update installed, relaunching...');
        await relaunch();
      }
    } catch (err) {
      console.error('[Updater] Download/install failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to download and install update');
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Software Updates</h3>
        <p className="text-xs text-gray-500 mb-3">
          Automatic download and installation of new versions
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-red-600">⚠️</span>
            <div className="flex-1">
              <div className="text-sm font-medium text-red-800">Update Error</div>
              <div className="text-xs text-red-600 mt-1">{error}</div>
            </div>
          </div>
        </div>
      )}

      {updateAvailable && updateInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-blue-600">🎉</span>
            <div className="flex-1">
              <div className="text-sm font-medium text-blue-800">Update Available</div>
              <div className="text-xs text-blue-600 mt-1">
                Version {updateInfo.version} • {updateInfo.date}
              </div>
            </div>
          </div>
        </div>
      )}

      {!updateAvailable && !checking && !updateInfo && !downloading && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <div className="text-sm text-green-800">You're up to date!</div>
          </div>
        </div>
      )}

      {downloading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 animate-spin">⏳</span>
            <div className="text-sm text-blue-800">Downloading and installing update...</div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={checkForUpdates}
          disabled={checking || downloading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {checking ? 'Checking...' : 'Check for Updates'}
        </button>

        {updateAvailable && (
          <button
            onClick={downloadAndInstall}
            disabled={downloading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {downloading ? 'Installing...' : 'Download & Install'}
          </button>
        )}
      </div>

      <div className="text-xs text-gray-500">
        Current version: {APP_VERSION}
      </div>
    </div>
  );
}
