import { ask } from '@tauri-apps/plugin-dialog';
import { open } from '@tauri-apps/plugin-shell';

const CURRENT_VERSION = '0.6.10';
const GITHUB_REPO = 'Hukushiyu/claude_terminal';
const CHECK_INTERVAL = 6 * 60 * 60 * 1000; // Check every 6 hours (not every launch)

export async function checkForUpdatesOnLaunch() {
  try {
    // Check if we've checked recently (avoid rate limits)
    const lastCheck = localStorage.getItem('lastUpdateCheck');
    const now = Date.now();

    if (lastCheck) {
      const timeSinceLastCheck = now - parseInt(lastCheck);
      if (timeSinceLastCheck < CHECK_INTERVAL) {
        console.log(`[Updater] Skipping check (last checked ${Math.round(timeSinceLastCheck / 1000 / 60)} minutes ago)`);
        return;
      }
    }

    console.log('[Updater] Checking GitHub for updates on launch...');
    localStorage.setItem('lastUpdateCheck', now.toString());

    // Optional: Add GitHub token for higher rate limits (5000/hour vs 60/hour)
    // For development, set VITE_GITHUB_TOKEN in .env.local (DO NOT COMMIT)
    // For production builds, use GitHub Actions secrets
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    };

    // Add token from environment variable (if available)
    const githubToken = import.meta.env.VITE_GITHUB_TOKEN;
    if (githubToken) {
      headers['Authorization'] = `Bearer ${githubToken}`;
      console.log('[Updater] Using authenticated GitHub API (higher rate limits)');
    }

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      { headers }
    );

    if (!response.ok) {
      if (response.status === 403) {
        // Rate limit hit - check if it's rate limit or auth issue
        const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
        const rateLimitReset = response.headers.get('X-RateLimit-Reset');

        if (rateLimitRemaining === '0' && rateLimitReset) {
          const resetDate = new Date(parseInt(rateLimitReset) * 1000);
          console.warn(`[Updater] GitHub API rate limit exceeded. Resets at ${resetDate.toLocaleTimeString()}`);
        } else {
          console.warn('[Updater] GitHub API access denied (403)');
        }

        // Silently fail - don't bother users with rate limit errors
        return;
      }
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
        console.log('[Updater] Opening download page:', release.html_url);
        try {
          await open(release.html_url);
        } catch (openError) {
          console.error('[Updater] Failed to open browser:', openError);
          // Fallback: show error with URL so user can copy it
          await ask(
            `Could not open browser automatically.\n\nPlease visit:\n${release.html_url}`,
            {
              title: 'Update Link',
              kind: 'error'
            }
          );
        }
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
