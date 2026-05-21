# Version Management Guide

## Single Source of Truth

All version numbers in the app now come from **one place**: `package.json`

The `src/version.ts` file automatically imports the version at build time, so you never need to manually update version strings in the UI.

---

## How to Change the Version

**1. Update `package.json` only:**
```json
{
  "version": "0.6.11"
}
```

**2. Also update these files** (for build metadata):
- `src-tauri/tauri.conf.json` → `"version": "0.6.11"`
- `src-tauri/Cargo.toml` → `version = "0.6.11"`

**3. Build the app:**
```bash
npm run build
```

**That's it!** All UI components will automatically show v0.6.11:
- ✅ Sidebar (under assistant name)
- ✅ Settings → Check for Updates → "Current version: 0.6.11"
- ✅ Auto-updater logic

---

## Where Version is Displayed

### Frontend (All auto-sync from package.json)
- **Sidebar:** Under assistant name (e.g., "CLAUDE v0.6.11")
- **Settings Modal:** "Current version: 0.6.11"
- **Update Checker:** Compares against GitHub releases

### Backend (Manual sync required)
- **Tauri config:** `src-tauri/tauri.conf.json` (used in About dialog, installers)
- **Cargo.toml:** `src-tauri/Cargo.toml` (Rust package metadata)

---

## Technical Details

### `src/version.ts`
```typescript
import packageJson from '../package.json';
export const APP_VERSION = packageJson.version;
export const GITHUB_REPO = 'Hukushiyu/claude_terminal';
```

Vite resolves `package.json` imports at build time, so the version is **baked into the bundle** (no runtime file reads).

### Components Using Version
- `src/components/layout/AppShell.tsx` - Sidebar display
- `src/components/settings/UpdateChecker.tsx` - Settings modal
- `src/utils/updater.ts` - Auto-update logic

---

## Version Bump Checklist

When releasing a new version:

- [ ] Update `package.json` version
- [ ] Update `src-tauri/tauri.conf.json` version
- [ ] Update `src-tauri/Cargo.toml` version
- [ ] Run `npm run build` (verifies all changes work)
- [ ] Run `npm run tauri:build` (creates installers)
- [ ] Commit: `git commit -m "Bump version to X.Y.Z"`
- [ ] Tag: `git tag vX.Y.Z`
- [ ] Push: `git push origin master --tags`
- [ ] Create GitHub Release with tag `vX.Y.Z`
- [ ] Upload build artifacts to release

---

## Why This System?

### Before (❌ Broken)
- Sidebar showed v0.6.8
- Settings showed v0.6.3
- Updater used v0.6.10
- **Result:** Confusing, out of sync, requires manual updates in 4+ places

### After (✅ Fixed)
- One edit in `package.json`
- Everything syncs automatically
- **Result:** Consistent, maintainable, no discrepancies

---

## Troubleshooting

### "Version still shows old number after build"
1. Make sure you updated `package.json`
2. Delete `dist/` folder
3. Run `npm run build` again
4. Hard refresh browser (Ctrl+Shift+R)

### "TypeScript error: Cannot find module '../package.json'"
1. Make sure `resolveJsonModule: true` is in `tsconfig.json` (already configured)
2. Restart TypeScript server in your editor

### "Version mismatch between UI and About dialog"
- UI comes from `package.json`
- About dialog comes from `src-tauri/tauri.conf.json`
- Make sure both are updated!

---

## Example: Bumping to v0.7.0

```bash
# 1. Edit package.json
sed -i 's/"version": "0.6.10"/"version": "0.7.0"/' package.json

# 2. Edit tauri.conf.json
sed -i 's/"version": "0.6.10"/"version": "0.7.0"/' src-tauri/tauri.conf.json

# 3. Edit Cargo.toml
sed -i 's/version = "0.6.10"/version = "0.7.0"/' src-tauri/Cargo.toml

# 4. Build and verify
npm run build
npm run tauri:build

# 5. Commit and release
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "Bump version to 0.7.0"
git tag v0.7.0
git push origin master --tags
```

Done! 🚀
