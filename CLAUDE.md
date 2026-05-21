# Claude Cozy - Tauri Edition

A desktop GUI wrapper for Claude CLI built with Tauri + Rust backend for improved performance and smaller bundle sizes.

## ⚠️ CRITICAL RULES - READ FIRST

### 🚨 ALWAYS ASK BEFORE PUSHING TO GITHUB

**MANDATORY: Never `git push` without explicit permission!**

Before running `git push origin master`:
1. ✅ Show what will be pushed: `git status`, `git log origin/master..HEAD`
2. ✅ **ASK USER:** "Ready to push X commits to GitHub? This will trigger a build."
3. ✅ Wait for explicit "yes" / "go ahead" / "push it"
4. ❌ NEVER assume the user wants to push immediately

**Why:**
- User may want to add more changes to the same commit/push
- GitHub Actions gets cluttered with too many builds
- Batching changes is more efficient

**Exception:** If user explicitly says "push it now" or "go ahead and push", then proceed.

---

### Git/Documentation Policy

**NEVER commit documentation files except these three:**
- ✅ `CLAUDE.md` - Project instructions (this file)
- ✅ `CHANGELOG.md` - Version history
- ✅ `README.md` - User-facing documentation

**FORBIDDEN:**
- ❌ Do NOT create or commit any other `.md` files (build guides, setup docs, feature specs, etc.)
- ❌ Do NOT commit PDFs, guides, or documentation artifacts
- ❌ Keep working notes LOCAL ONLY (they're in `.gitignore`)

**Why:** User wants minimal repo - only essential files in git.

**How to document:**
- Add notes to `CLAUDE.md` if it's for developers/Claude
- Add to `CHANGELOG.md` if it's version history
- Add to `README.md` if it's for end users
- Otherwise, keep it local (don't commit)

---

## Project Overview

**Purpose:** Provide developers with a visual interface for Claude CLI without terminal complexity.

**Tech Stack:**
- **Frontend:** React 18 + TypeScript + Tailwind CSS
- **Backend:** Rust + Tauri 2.x
- **Build Tool:** Vite 6
- **State Management:** Zustand
- **CLI Integration:** Claude CLI via Rust process spawning

**Current Status:** ✅ Production-ready v0.6.10 - Auto-update system implemented

## Auto-Update System

**How it works:**
1. App checks GitHub Releases on launch (every 6 hours)
2. If update available, shows dialog with version info
3. User clicks "Download & Install"
4. **Automatically downloads** the installer
5. **Automatically installs** the update
6. **Automatically restarts** the app

**No more manual downloads!** Users get seamless updates.

**Requirements for releases:**
- Must upload a `latest.json` manifest to each release
- Template: `.github/update-manifest-template.json`
- See "Creating Releases" section below for details

## Architecture

### High-Level Structure

```
┌─────────────────────────────────────────────┐
│         Tauri Core (Rust Backend)           │
│  - src-tauri/src/commands/*.rs              │
│  - Process spawning (Claude CLI)            │
│  - File system operations                   │
│  - IPC command handlers                     │
└─────────────────────────────────────────────┘
                    ↕ IPC (invoke/emit)
┌─────────────────────────────────────────────┐
│         React Renderer (Frontend)           │
│  - Chat interface with streaming            │
│  - File tree explorer (VS Code style)       │
│  - Project management                       │
│  - State management (Zustand)               │
└─────────────────────────────────────────────┘
```

### Key Directories

- **`src-tauri/src/commands/`** - Rust IPC command handlers
  - `project.rs` - Project folder selection
  - `files.rs` - File operations and tree loading
  - `chat.rs` - Claude CLI integration (most complex)
  - `history.rs` - Conversation persistence
  - `git.rs` - Git status integration
  - `cli.rs` - CLI authentication checks

- **`src/`** - React frontend (same as Electron version)
  - `components/` - React components
  - `stores/` - Zustand state stores
  - `utils/tauri-api.ts` - Tauri API wrapper
  - `types/` - TypeScript type definitions

- **`src-tauri/`** - Rust backend
  - `src/main.rs` - Entry point
  - `src/lib.rs` - App setup and command registration
  - `Cargo.toml` - Rust dependencies
  - `tauri.conf.json` - Tauri configuration

## Current Features (v0.6.8 - Released May 21, 2026)

All features from Electron v0.5.2 have been successfully migrated plus new enhancements:

### ✅ Core Features
1. **Chat interface** - Claude CLI streaming with full event handling
2. **Permission system** - Simplified modal (shows file path + size, not full content)
3. **Thinking indicators** - Status updates with timer display
4. **Tool execution** - All Claude CLI tools working (Read, Write, Edit, Bash, etc.)
5. **Tool cards** - Improved display (shows "Executing..." instead of empty {})
6. **Message retry** - Invisible retry after permission approval
7. **Project selection** - Folder picker with file tree
8. **File tree** - Lazy loading, .gitignore support, search
9. **File preview** - Text files with syntax highlighting + images (PNG, JPG, GIF, SVG, etc.)
10. **@ File references** - Click @ button on file hover to insert reference into chat
11. **Conversation history** - Save/load/archive with CLI integration
12. **Theme system** - 6 color schemes
13. **Model selector** - Sonnet 4.6, Opus 4.7, Haiku 4.5
14. **CLI authentication** - Auto-check with terminal launcher
15. **Auto-update system** - Checks GitHub releases on launch + manual check in Settings
16. **Mac code signing** - Developer ID signed builds, no Gatekeeper warnings (v0.6.4+)
17. **DMG installer** - Beautiful Mac disk image installer (v0.6.4+)

### 🔮 Future Enhancements
1. **HTML5 Drag & Drop** - Enable native drag-drop for file references
   - Current limitation: Tauri intercepts drag events for external file drops
   - Status: Button implementation works well, drag-drop is optional enhancement
2. **Git Integration** - Restore Git status indicators and actions
3. **Session Browser UI** - Browse and restore past CLI sessions (backend complete)
4. **CLI Flags Modal** - GUI interface for advanced CLI options (--fork-session, --effort, --system-prompt, etc.)
5. **Signed updates** - Full Tauri updater with automatic download/install

## Development Setup

### Prerequisites

**1. Rust Toolchain**
```bash
# Check if installed
rustc --version
cargo --version

# Install if needed:
# Windows: https://www.rust-lang.org/tools/install
# Mac: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**2. System Dependencies**

**Windows:**
- Visual Studio C++ Build Tools
- WebView2 Runtime (pre-installed on Win10/11)

**Mac:**
- Xcode Command Line Tools: `xcode-select --install`

**3. Node.js & npm**
Already installed (v18+)

**4. Claude CLI**
```bash
# Must be installed and authenticated
claude --version
claude auth login
```

### Installation

```bash
npm install
```

### Development

```bash
# Run in dev mode with hot reload
npm run tauri:dev
```

This will:
1. Start Vite dev server on port 1420
2. Compile Rust backend
3. Launch Tauri window
4. Enable hot reload for frontend changes

### Building

```bash
# Build for current platform
npm run tauri:build

# Build for Windows
npm run tauri:build:win

# Build for Mac (Apple Silicon)
npm run tauri:build:mac:arm64

# Build for Mac (Intel)
npm run tauri:build:mac:x64

# Build for Mac (Universal)
npm run tauri:build:mac:universal
```

Build outputs: `src-tauri/target/release/bundle/`

## Tauri-Specific Patterns

### IPC Commands

**Defining a command in Rust:**
```rust
// src-tauri/src/commands/example.rs
#[tauri::command]
pub async fn example_command(param: String) -> Result<String, String> {
    // Do work
    Ok("result".to_string())
}
```

**Register in lib.rs:**
```rust
.invoke_handler(tauri::generate_handler![
    commands::example::example_command,
])
```

**Call from frontend:**
```typescript
import { tauriAPI } from './utils/tauri-api';
const result = await tauriAPI.exampleCommand(param);
```

### Event Emission

**Emit from Rust:**
```rust
use tauri::Emitter;

app.emit("event-name", payload)?;
```

**Listen from frontend:**
```typescript
import { listen, UnlistenFn } from '@tauri-apps/api/event';

useEffect(() => {
  let unlisten: UnlistenFn | null = null;
  
  listen('event-name', (event) => {
    // handle event.payload
  }).then(fn => { unlisten = fn; });
  
  return () => {
    if (unlisten) unlisten();
  };
}, []);
```

### File System Access

Tauri has strict file system permissions configured in `tauri.conf.json`:

```json
"plugins": {
  "fs": {
    "scope": ["$APPDATA/*", "$RESOURCE/*", "**"]
  }
}
```

User-selected directories are automatically added to scope.

## Claude CLI Integration

### Current Implementation (Rust)

```rust
// src-tauri/src/commands/chat.rs
pub async fn send_message(
    app: AppHandle,
    message: String,
    project_path: String,
    model: String,
    skip_permissions: bool,
) -> Result<(), String>
```

**Key features:**
- Spawns `claude` process with `--output-format stream-json`
- Parses line-delimited JSON events
- Emits events to frontend: `chat:chunk`, `chat:thinking`, `chat:tool`, `chat:result`, `chat:error`
- Handles rate limits and retries
- Thread-safe process management

**Event types emitted:**
- `assistant` → `chat:chunk` (text content)
- `thinking` → `chat:thinking` (status updates)
- `tool_use` → `chat:tool` (tool execution)
- `result` → `chat:result` (conversation complete)
- `system` → `chat:thinking` (rate limits)
- `error` → `chat:error` (errors)

### Frontend Integration

```typescript
// Send message
await tauriAPI.sendMessage(content, projectPath, model, skipPermissions);

// Listen for chunks
const unlisten = await tauriAPI.onMessageChunk((chunk) => {
  // append chunk to UI
});
```

## Configuration

### Tauri Config (`src-tauri/tauri.conf.json`)

Key settings:
- **App identifier:** `com.claudeterminal.app`
- **Window dimensions:** 1400x900 (min: 1000x600)
- **Bundle targets:** Windows (NSIS), Mac (DMG, ZIP)
- **Plugins:** dialog, fs, shell
- **Shell scope:** Allows `claude`, `git`, `cmd`, `terminal`

### Rust Dependencies (`src-tauri/Cargo.toml`)

Main dependencies:
- `tauri` (v2.11.1) - Core framework
- `tauri-plugin-dialog` - File picker dialogs
- `tauri-plugin-fs` - File system operations
- `tauri-plugin-shell` - Shell command execution
- `tokio` - Async runtime for streaming
- `serde` / `serde_json` - JSON serialization
- `ignore` - .gitignore parsing
- `chrono` - Timestamp formatting
- `lazy_static` - Global state management

## Frontend API Wrapper

**Location:** `src/utils/tauri-api.ts`

This wrapper provides API compatibility with the Electron version:

```typescript
// Electron (old)
await window.electronAPI.sendMessage(content);

// Tauri (new) - same interface!
import { tauriAPI } from '../utils/tauri-api';
await tauriAPI.sendMessage(content, projectPath, model, skipPermissions);
```

**Key differences:**
- Tauri requires explicit `projectPath` and `model` parameters
- Event listeners return `UnlistenFn` for cleanup
- Async initialization for listeners

## Testing Strategy

### Current Status
- Backend: Rust code compiles successfully
- Frontend: Migration in progress

### Testing Checklist

**Functional Testing:**
- [ ] Project selection dialog works
- [ ] File tree loads with .gitignore respect
- [ ] File preview displays correctly
- [ ] Chat sends messages to Claude CLI
- [ ] Streaming responses display
- [ ] Thinking indicators show
- [ ] Tool execution works
- [ ] History saves/loads/archives
- [ ] Git status indicators update
- [ ] Theme changes apply
- [ ] Model selector works
- [ ] CLI auth check on startup
- [ ] Terminal launcher opens

**Performance Testing:**
- [ ] Bundle size < 20MB
- [ ] Memory usage < 150MB idle
- [ ] Startup time < 2 seconds

**Platform Testing:**
- [ ] Windows 10/11 build works
- [ ] Mac Intel build works
- [ ] Mac Apple Silicon build works

## Build & Release

### Development Build

```bash
npm run tauri:dev
```

### Production Build

```bash
# Windows
npm run tauri:build:win
# Output: src-tauri/target/release/bundle/nsis/

# Mac (on Mac only)
npm run tauri:build:mac:universal
# Output: src-tauri/target/release/bundle/dmg/ and .app
```

### Code Signing (v0.6.4+)

**Mac builds are automatically signed via GitHub Actions:**
- Uses Apple Developer ID certificate
- No Gatekeeper warnings for users
- DMG and ZIP both signed
- See `GITHUB_SIGNING_SETUP.md` for configuration details

**Windows builds are currently unsigned:**
- Users may see SmartScreen warning on first run
- Can be bypassed with "More info" → "Run anyway"
- Future: Will add Windows code signing certificate

### Automated Builds

All releases are built via GitHub Actions (`.github/workflows/build.yml`):
- **Windows:** NSIS installer (`.exe`) + MSI installer
- **Mac:** DMG installer (`.dmg`) + ZIP archive (`.zip`)
- **Mac signing:** Automatic via GitHub Secrets
- **Artifacts:** Available for download after each build

### Bundle Size Comparison

| Platform | Electron | Tauri | Savings |
|----------|----------|-------|---------|
| Windows | 150MB+ | 10-15MB | ~90% |
| Mac | 120MB+ | 5-8MB | ~93% |

## Known Differences from Electron

### IPC Pattern
- **Electron:** `ipcMain.handle()` / `ipcRenderer.invoke()`
- **Tauri:** `#[tauri::command]` / `invoke()`

### Events
- **Electron:** `webContents.send()` / `ipcRenderer.on()`
- **Tauri:** `window.emit()` / `listen()`

### Event Cleanup
- **Electron:** `removeAllListeners(channel)`
- **Tauri:** Call `unlisten()` function

### Process Model
- **Electron:** Multi-process (main + renderer)
- **Tauri:** Single-process with OS WebView

### Bundle
- **Electron:** Includes Chromium (~120MB)
- **Tauri:** Uses OS WebView (~5-15MB)

## Security

### Tauri Security Model

More restrictive than Electron:

1. **No Node.js in renderer** - Frontend is pure web with limited API access
2. **Feature-based permissions** - Must explicitly enable each API
3. **Scoped file system** - Only approved paths accessible
4. **Command allowlist** - Shell commands must be pre-approved
5. **CSP headers** - Content Security Policy enforced

### Configured Permissions

```json
{
  "dialog": { "all": true },
  "fs": { "scope": ["**"] },
  "shell": {
    "scope": [
      { "name": "claude", "cmd": "claude", "args": true },
      { "name": "git", "cmd": "git", "args": true }
    ]
  }
}
```

## Performance Considerations

### Benefits Over Electron

1. **Smaller binary** - No bundled Chromium
2. **Lower memory** - Uses OS WebView (shared)
3. **Faster startup** - Less to initialize
4. **Native integration** - Better OS feel

### Streaming Optimization

Claude CLI integration uses:
- Tokio async runtime for non-blocking I/O
- Line-buffered JSON parsing
- Event emission without blocking
- Efficient string handling in Rust

## Common Issues & Solutions

### "rustc not found"
```bash
# Install Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### "WebView2 not found" (Windows)
```bash
winget install Microsoft.EdgeWebView2Runtime
```

### Compilation errors
```bash
cd src-tauri
cargo clean
cargo check
```

### Frontend API errors
- Ensure `tauriAPI` is imported: `import { tauriAPI } from '../utils/tauri-api'`
- Check parameters match Rust command signature
- Verify event names match between Rust emit and frontend listen

## Code Style

### Rust
- Use `rustfmt` for formatting: `cargo fmt`
- Use `clippy` for linting: `cargo clippy`
- Follow Rust naming conventions (snake_case for functions)
- Document public functions with `///` comments

### TypeScript
- Same style as Electron version
- Use TypeScript for all files
- Follow existing naming conventions
- Add types for all function parameters

## Future Enhancements

### Phase 1 (Current)
- ✅ Backend migration complete
- ⏳ Frontend migration in progress

### Phase 2
- Performance benchmarking vs Electron
- Memory profiling
- Startup time optimization

### Phase 3
- Code signing for distribution
- Auto-updater integration
- Cross-platform testing

### Phase 4
- Mobile support (iOS/Android via Tauri)
- Additional plugin integrations
- Enhanced file operations

## Resources

### Documentation
- [Tauri Documentation](https://tauri.app/)
- [Tauri API Reference](https://tauri.app/v1/api/js/)
- [Rust Book](https://doc.rust-lang.org/book/)
- [Tokio Documentation](https://tokio.rs/)

### Community
- [Tauri Discord](https://discord.com/invite/tauri)
- [GitHub Discussions](https://github.com/tauri-apps/tauri/discussions)

### Examples
- [Tauri Examples](https://github.com/tauri-apps/tauri/tree/dev/examples)
- [Awesome Tauri](https://github.com/tauri-apps/awesome-tauri)

## Contributing

### Before Committing

1. **Rust code:**
   ```bash
   cd src-tauri
   cargo fmt
   cargo clippy
   cargo test
   ```

2. **TypeScript code:**
   ```bash
   npm run build  # Check for type errors
   ```

3. **Test in dev mode:**
   ```bash
   npm run tauri:dev
   ```

### Git Workflow

- Create feature branches from `main`
- Use descriptive commit messages
- Test locally before committing
- Update relevant documentation

## Contact & Support

For issues:
- Check existing GitHub issues
- Create new issue with:
  - Tauri version (`cargo tauri --version`)
  - OS and version
  - Rust version (`rustc --version`)
  - Steps to reproduce
  - Error logs

---

**Version:** 0.6.8  
**Status:** Production-ready - Thinking indicator fixes, devtools enabled  
**Framework:** Tauri 2.x + Rust  
**Last Updated:** May 19, 2026
