# Changelog

All notable changes to Claude Cozy will be documented in this file.

## [0.8.0] - 2026-06-02

### 🎉 Major Features

#### Multi-Tab Session System
- **Up to 6 concurrent tabs** - Work on multiple projects simultaneously
- **Per-tab state isolation** - Each tab has independent:
  - Chat history and streaming messages
  - File tree and file explorer state
  - Permission mode (Ask/Accept Edits/Auto-Approve)
  - Model selection (Sonnet/Opus/Haiku)
  - Session ID and conversation context
- **Tab management**
  - Create tab: Click folder icon or Ctrl+T
  - Close tab: Click × or Ctrl+W
  - Switch tabs: Click tab or Ctrl+Tab/Ctrl+Shift+Tab
  - Right-click tab for context menu (Close, Close Others, Close All)
  - Tabs persist across app restarts
- **Smart project selector** - Auto-hides when tabs exist, auto-shows when all closed
- **TabBar component** - VS Code-style tab interface at top of window

#### Sidebar Reorganization
- **Moved Sessions to sidebar** - Per-tab Session History button (was global header button)
- **Consolidated controls** - Permissions and Model selector in sidebar above file tree
- **Per-tab sessions** - Each project's sessions isolated to that tab

#### Custom Skills Management System
- **Skills Manager UI** - 🛠️ Skills button in header opens full management interface
- **Create custom skills** - Define your own slash commands with icons, descriptions, usage examples
- **CRUD operations** - Add, edit, and delete custom skills via intuitive form
- **Autocomplete integration** - Custom skills appear in / autocomplete alongside built-in skills
- **Help modal integration** - Custom skills shown in Ctrl+/ help reference
- **Persistence** - Skills saved to localStorage and persist across restarts
- **Built-in skills display** - View all built-in Claude CLI skills (read-only)
- **Validation** - Duplicate name detection, required field validation
- **Categories** - Organize skills by type (custom, configuration, workflow, etc.)

### 🐛 Bug Fixes

#### Tool Cards Display Fix
- **Shows actual tool input** - Tool cards now display file paths, bash commands, and operation details instead of "{}"
- **Backend enhancement** - Added `tool_input` field to Rust `StreamEvent` struct
- **Frontend parser** - Properly extracts and displays `input.file_path`, `input.command`, etc.

#### Permission System Overhaul
- **Fixed permission synchronization** - Permission mode now properly synced between frontend and Rust backend
- **Tab-aware permissions** - Permission mode syncs on tab create, tab switch, and dropdown change
- **Backend state management** - `tauriAPI.setPermissionMode()` ensures Rust respects active tab's mode

#### File Explorer Per-Tab Fix
- **Fixed file tree showing wrong project** - File explorer now updates correctly when switching tabs
- **Per-tab file tree state** - Each tab maintains separate `fileTreeStates` in `tabStore`
- **Lazy loading per tab** - File trees load independently for each project

#### Chat Rendering Fix
- **Fixed infinite render loop** - Changed from multiple Zustand selectors to single selector pattern
- **Stable subscriptions** - Single `activeTabState` selector prevents unstable function references
- **Type-safe selectors** - Proper TypeScript annotations prevent implicit `any` errors

### 🔧 Technical Improvements

#### State Architecture
- **Zustand per-tab pattern** - `Record<tabId, state>` structure for chat and file trees
- **Single selector optimization** - One subscription per component instead of 7 unstable selectors
- **Tab context propagation** - All components now tab-aware via `activeTabId`

#### IPC & Backend
- **Permission mode API** - Added `set_permission_mode` Tauri command
- **Tool input extraction** - Rust backend extracts and serializes `tool_input` from Claude CLI JSON
- **Session management** - Backend tracks per-tab session IDs

### 📝 Documentation
- **Updated MULTI_TAB_SESSION_NOTES.md** - Complete implementation notes and architecture decisions
- **devLog.log gitignore exception** - Whitelisted dev log for Claude CLI file referencing

### 🎨 UI/UX
- **Tab visual feedback** - Active tab highlighted, hover states, close button on hover
- **Empty state handling** - Clear messaging when no tabs exist
- **Keyboard shortcuts** - Full keyboard navigation for tab operations

---

## [0.7.1] - 2026-05-26

### Added
- **Session Browser** - Browse, load, and manage conversation sessions
  - View all past sessions with metadata (date range, message count)
  - Load any previous session to restore chat history
  - Delete individual sessions with confirmation
  - Active session indicator (purple highlight + badge)
  - "Delete All" button for clearing all sessions (with strong confirmation)
- **Context compression indicator** - Shows "Compressing conversation context..." when CLI manages context window
- **Session ID tracking** - App now tracks which session is currently active

### Changed
- **Removed Clear History button from header** - Moved to Session Browser modal as "Delete All"
- **Improved session management** - All session operations now in one unified interface
- **🚀 MAJOR: Bidirectional stdio protocol for permissions** - Complete architectural overhaul eliminating double execution penalty

### Fixed
- **Path encoding for session files** - Correctly handles Windows paths with spaces, dots, and special characters
- **Session file lookup** - Now properly matches Claude CLI's path encoding algorithm

### Technical - Bidirectional Permission Protocol (Major Architecture Change)

**What Changed:**
Migrated from kill-and-retry pattern to bidirectional stdio communication with Claude CLI.

**Old Architecture (v0.6.x and earlier):**
1. Send message → spawn Claude CLI process
2. CLI encounters tool requiring permission → blocks/hangs
3. App detects tool_use event → kills process, shows permission modal
4. User approves → restart CLI with `--dangerously-skip-permissions`
5. **DOUBLE EXECUTION**: Entire message processed twice

**Problems with old approach:**
- 50% performance penalty (every permission request = 2x work)
- Process management complexity (kill, restart, retry)
- Lost context between executions
- Race conditions during process termination

**New Architecture (v0.7.1):**
1. Send message → spawn CLI with `--permission-mode acceptEdits` + `--input-format stream-json`
2. User message sent to CLI via stdin as JSON
3. CLI encounters tool → emits `control_request` event to stdout (doesn't block)
4. App shows permission modal, user approves
5. App sends `control_response` JSON back to stdin
6. **SINGLE EXECUTION**: Same process continues naturally

**Benefits:**
- ✅ Eliminates double execution (2x faster for permission requests)
- ✅ Single Claude CLI process per message (simpler state management)
- ✅ Bidirectional communication enables future features
- ✅ Cleaner logs (no restart noise)
- ✅ More reliable (no process kill race conditions)

**Implementation Details:**
- CLI spawned with stdin piped: `.stdin(Stdio::piped())`
- User messages written to stdin as JSON: `{"type":"user","uuid":"...","message":{...}}`
- Permission requests received via stdout: `{"type":"control_request","request_id":"...","subtype":"can_use_tool",...}`
- Responses sent via stdin: `{"type":"control_response","response":{"subtype":"success","request_id":"...","response":{"behavior":"allow",...}}}`
- Changed from `std::sync::Mutex` to `tokio::sync::Mutex` for async stdin writes
- 6 permission modes supported: default, acceptEdits, bypassPermissions, plan, auto, dontAsk
- `acceptEdits` mode as default (auto-approves Read/Write/Edit, prompts for Bash)

**Files Modified:**
- `src-tauri/src/commands/chat.rs` - Bidirectional stdio, control protocol handlers
- `src-tauri/src/commands/permissions.rs` - Permission mode enum (1:1 with CLI)
- `src/types/permissions.ts` - Frontend permission types
- `src/components/layout/PermissionStatusButton.tsx` - Dropdown picker for modes
- `src/components/settings/SettingsModal.tsx` - Permission mode settings UI

**Session Management:**
- Added `list_sessions`, `load_session`, `delete_session` Rust commands
- Fixed path encoding: `C:\Users\name\project` → `C--Users-name-project`
- Atomic drive letter handling: `:\` → `--` (prevents triple dashes)
- Session ID extracted from CLI `system` init events and tracked in frontend

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
