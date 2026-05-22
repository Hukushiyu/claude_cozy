import { check } from '@tauri-apps/plugin-updater';
import { ask } from '@tauri-apps/plugin-dialog';
import { relaunch } from '@tauri-apps/plugin-process';

const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes (for testing - change to 6 hours for production)

export async function checkForUpdatesOnLaunch() {
  try {
    // Check if we've checked recently (avoid excessive checks)
    const lastCheck = localStorage.getItem('lastUpdateCheck');
    const now = Date.now();

    if (lastCheck) {
      const timeSinceLastCheck = now - parseInt(lastCheck);
      if (timeSinceLastCheck < CHECK_INTERVAL) {
        console.log(`[Updater] Skipping check (last checked ${Math.round(timeSinceLastCheck / 1000 / 60)} minutes ago)`);
        return;
      }
    }

    console.log('[Updater] Checking for updates...');
    localStorage.setItem('lastUpdateCheck', now.toString());

    const update = await check();

    if (update) {
      console.log(`[Updater] Update available: ${update.version} (current: ${update.currentVersion})`);

      const yes = await ask(
        `A new version (${update.version}) is available!\n\nWould you like to download and install it now?\n\nThe app will restart after installation.`,
        {
          title: 'Update Available',
          kind: 'info'
        }
      );

      if (yes) {
        console.log('[Updater] User accepted update, downloading...');

        // Download and install the update
        await update.downloadAndInstall();

        console.log('[Updater] Update installed, relaunching...');

        // Restart the app
        await relaunch();
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
