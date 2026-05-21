import { useState } from 'react';
import { open } from '@tauri-apps/plugin-shell';
import { APP_VERSION, GITHUB_REPO } from '../../version';

const CURRENT_VERSION = APP_VERSION;

interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
}

export function UpdateChecker() {
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{ version: string; url: string; date: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkForUpdates = async () => {
    setChecking(true);
    setError(null);

    try {
      console.log('[Updater] Checking GitHub for latest release...');
      const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);

      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`);
      }

      const release: GitHubRelease = await response.json();
      const latestVersion = release.tag_name.replace(/^v/, ''); // Remove 'v' prefix if present

      console.log('[Updater] Latest version:', latestVersion, 'Current:', CURRENT_VERSION);

      if (latestVersion !== CURRENT_VERSION) {
        console.log('[Updater] Update available!');
        setUpdateAvailable(true);
        setUpdateInfo({
          version: latestVersion,
          url: release.html_url,
          date: new Date(release.published_at).toLocaleDateString()
        });
      } else {
        console.log('[Updater] You\'re up to date!');
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

  const openDownloadPage = async () => {
    if (updateInfo) {
      console.log('[Updater] Opening download page:', updateInfo.url);
      await open(updateInfo.url);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Software Updates</h3>
        <p className="text-xs text-gray-500 mb-3">
          Check for new versions of Claude Cozy
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
                Version {updateInfo.version} • Released {updateInfo.date}
              </div>
            </div>
          </div>
        </div>
      )}

      {!updateAvailable && !checking && !updateInfo && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <div className="text-sm text-green-800">You're up to date!</div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={checkForUpdates}
          disabled={checking}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {checking ? 'Checking...' : 'Check for Updates'}
        </button>

        {updateAvailable && (
          <button
            onClick={openDownloadPage}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Download Update
          </button>
        )}
      </div>

      <div className="text-xs text-gray-500">
        Current version: {CURRENT_VERSION}
      </div>
    </div>
  );
}
