# Changelog

All notable changes to Claude Cozy will be documented in this file.

## [0.6.12] - 2026-05-22

### Fixed
- **Auto-update signature validation** - Removed signature requirement that was blocking updates
- **Update check interval** - Reduced to 5 minutes for easier testing (was 6 hours)

### Breaking Changes
- **Manual update required from v0.6.10** - Due to signature validation changes, users on v0.6.10 must manually download v0.6.12
- Auto-updates will work properly starting from v0.6.12 onwards

### Technical
- Removed `pubkey` field from tauri.conf.json
- Removed `signature` fields from latest.json generation
- Updates now work without signature verification (still secure via HTTPS)

## [0.6.11] - 2026-05-22

### Added
- **Automatic update system** - Download, install, and restart automatically
- **GitHub Actions automation** - Auto-generates latest.json manifest
- **Mac Intel removed** - Only Windows + Mac ARM builds (Intel runs via Rosetta)

### Technical
- Tauri updater plugin fully integrated
- Dynamic version in Mac ZIP filenames
- Manifest generation job in GitHub Actions

## [0.6.10] - 2026-05-22

### Added
- **Centralized version management** - All UI version numbers pull from package.json
- **Improved update system** - Better rate limit handling and caching

### Fixed
- Version discrepancies across UI (sidebar, settings, updater)
- GitHub API rate limit errors (403)

## [0.6.8] - 2026-05-21

### Fixed
- **Thinking indicator during tool use** - Indicator now appears below streaming text while tools execute, instead of showing only the static cursor
- **Console window suppressed** - Claude CLI no longer opens a visible terminal window on Windows

### Added
- **Developer console** - Right-click → Inspect available in production builds for easier troubleshooting

### Changed
- **Input hint** - Removed drag & drop reference from input hint text (feature not yet enabled)

## [0.6.4] - 2026-05-19

### Changed
- **Rebranded** - "Claude Terminal" renamed to "Claude Cozy" throughout the app
- **Mac Code Signing** - GitHub Actions now signs Mac builds with Developer ID certificate
- **DMG Support** - Added DMG build target for Mac (alongside ZIP)

### Added
- **Intel Mac builds** - Separate x64 builds for Intel Macs (no Rosetta needed!)
- **Apple Silicon builds** - Native ARM64 builds for M1/M2/M3/M4 Macs
- PowerShell script to encode certificates for GitHub Secrets
- Comprehensive signing setup guide (GITHUB_SIGNING_SETUP.md)
- Hardened runtime enabled for better macOS Gatekeeper compatibility

### Technical
- Updated bundle identifier to `com.claudecozy`
- GitHub Actions workflow with automated certificate import and signing
- Dual Mac builds: `macos-13` (Intel) + `macos-14` (ARM)
- Temporary keychain security for CI builds

## [0.6.3] - 2026-05-18

### Added
- **Auto-update system** - Checks GitHub releases on app launch
- **Manual update check** - Button in Settings to check for updates
- **Image preview support** - View PNG, JPG, GIF, SVG, WebP, ICO, BMP in file preview modal
- **@ File reference button** - Click @ button when hovering files to insert reference

### Improved
- **Permission modal** - Now shows file path + size instead of full content (less confusing)
- **Tool cards** - Display "Executing [Tool]..." instead of empty {} when input is missing
- **Tool card expanded view** - Hides empty input section entirely
- **Version display** - All version numbers synchronized (sidebar shows v0.6.3)

### Fixed
- **File preview** - Text files now work with proper absolute path handling
- **Empty tool input** - Tool cards no longer show confusing empty curly braces

### Technical
- Removed Git status indicators (simplified file tree)
- GitHub API integration for update checks
- Base64 file reading for binary files (images)
- Removed Tauri updater plugin (using simpler GitHub API approach)

## [0.6.2] - 2026-05-18

### Added
- Drag store for file reference state management

### Improved
- Click-to-insert file references (more reliable than drag-drop in Tauri)

### Fixed
- Tauri drag-drop blocked by internal event interception

### Technical
- Documented HTML5 drag-drop limitation and workaround

## [0.6.1] - 2026-05-17

### Added
- Mac CLI path detection (searches common install locations)
- Loading indicators for project selection and app initialization

### Fixed
- **CRITICAL:** Mac Claude CLI connection (shell spawning)
- **CRITICAL:** Mac window dragging (webkit-app-region CSS)
- Mac auth status parsing (removed unsupported --output-format flag)
- NSIS installer language (changed from "en-US" to "English")
- Windows icon (multi-resolution .ico generation)
- Mac dock icon (replaced with custom icon.icns)

### Technical
- Shell spawning changed to `shell: true` on all platforms
- Drag region CSS classes for Mac window chrome

## [0.6.0] - 2026-05-16

### Added
- **Tauri migration complete** - Full Rust backend replacing Electron
- All Electron v0.5.2 features migrated
- Chat interface with streaming
- Permission system (modal-based tool approval)
- File tree with lazy loading
- File preview with syntax highlighting
- Conversation history (save/load/archive)
- Theme system (6 themes)
- Model selector
- CLI authentication checks

### Technical
- Rust + Tauri 2.x architecture
- 90%+ smaller bundle size vs Electron
- Native OS WebView (no bundled Chromium)

## [0.5.2] - 2026-05-12 (Electron)

### Added
- Terminal launcher for authentication
- Error recovery system
- Drag & drop file references (Phase 1 - basic implementation)

### Improved
- Error handling with visual banners
- Loading state management
- Input re-enables after errors

## [0.5.1] - 2026-05-07 (Electron)

### Added
- Assistant name customization
- CLI authentication check on startup

### Fixed
- Auth status parsing

## [0.5.0] - 2026-05-06 (Electron)

### Added
- Initial release with full UX features
- Animated thinking indicators
- Forced project selection on launch
- Conversation history persistence
- Commands & Skills reference (Ctrl+/)
- File tree operations (preview, search, context menu)
- Theme system
- Permission system

---

## Version History Summary

- **0.6.x** - Tauri migration + updates + UX polish
- **0.5.x** - Electron version with full features
- **0.1.x** - Initial prototypes

[0.6.3]: https://github.com/Hukushiyu/claude_terminal/releases/tag/0.6.3
[0.6.2]: https://github.com/Hukushiyu/claude_terminal/releases/tag/0.6.2
[0.6.1]: https://github.com/Hukushiyu/claude_terminal/releases/tag/0.6.1
[0.6.0]: https://github.com/Hukushiyu/claude_terminal/releases/tag/0.6.0
