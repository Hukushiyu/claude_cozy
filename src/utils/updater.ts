import { ask } from '@tauri-apps/plugin-dialog';
import { open } from '@tauri-apps/plugin-shell';

const CURRENT_VERSION = '0.6.3';
const GITHUB_REPO = 'Hukushiyu/claude_terminal';

export async function checkForUpdatesOnLaunch() {
  try {
    console.log('[Updater] Checking GitHub for updates on launch...');

    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const release = await response.json();
    const latestVersion = release.tag_name.replace(/^v/, '');

    console.log('[Updater] Latest:', latestVersion, 'Current:', CURRENT_VERSION);

    if (latestVersion !== CURRENT_VERSION) {
      console.log('[Updater] Update available!');

      const yes = await ask(
        `A new version (${latestVersion}) is available!\n\nWould you like to download it now?`,
        {
          title: 'Update Available',
          kind: 'info'
        }
      );

      if (yes) {
        console.log('[Updater] Opening download page...');
        await open(release.html_url);
      } else {
        console.log('[Updater] User declined update');
      }
    } else {
      console.log('[Updater] Already on latest version');
    }
  } catch (err) {
    console.error('[Updater] Auto-check failed:', err);
    // Silently fail - don't block app launch
  }
}
