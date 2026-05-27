/**
 * Application version - single source of truth
 *
 * This version is automatically synced with package.json during build.
 * Update package.json version and run `npm run build` to sync.
 */

// Import version from package.json (Vite will resolve this at build time)
import packageJson from '../package.json';

export const APP_VERSION = packageJson.version;

// For convenience
export const GITHUB_REPO = 'Hukushiyu/claude_cozy';
