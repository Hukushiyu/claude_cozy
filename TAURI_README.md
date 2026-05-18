# Claude Terminal - Tauri Edition

This is the **Tauri-based version** of Claude Terminal, migrated from Electron for improved performance and smaller bundle sizes.

## Migration Status: 🚧 IN PROGRESS

### ✅ Completed (Phase 1 & 2)

**Backend (Rust):**
- ✅ Tauri project initialized
- ✅ All Tauri plugins configured (dialog, fs, shell)
- ✅ Cargo.toml dependencies configured
- ✅ Command modules created:
  - `commands/project.rs` - Project folder selection
  - `commands/files.rs` - File tree, read/write, create/rename/delete
  - `commands/chat.rs` - Claude CLI integration with streaming
  - `commands/history.rs` - Conversation history persistence
  - `commands/git.rs` - Git status checking
  - `commands/cli.rs` - CLI authentication checking, terminal launcher

**Frontend:**
- ✅ Package.json updated (removed Electron deps, added Tauri)
- ✅ Vite config updated for Tauri
- ✅ `src/utils/tauri-api.ts` created - Tauri API wrapper
- ✅ Icons copied to `src-tauri/icons/`
- ✅ Source files copied from Electron version

### ⏳ Pending (Phase 3 & 4)

**Frontend Updates Needed:**
1. Update all stores to use `tauriAPI` instead of `window.electronAPI`:
   - `src/stores/chatStore.ts` - Chat state management
   - `src/stores/fileTreeStore.ts` - File tree state
   - `src/stores/projectStore.ts` - Project state
   - `src/stores/settingsStore.ts` - Settings state

2. Update components to use Tauri event listeners:
   - `src/components/chat/ChatInterface.tsx`
   - `src/components/file-tree/FileTree.tsx`
   - `src/components/layout/AppShell.tsx`

3. Handle unlisten cleanup in useEffect hooks

4. Remove Electron-specific code and types

5. Test all features:
   - Project selection
   - File tree loading and operations
   - Chat with Claude CLI
   - Conversation history
   - Git status
   - Settings persistence

## Prerequisites

Before building, ensure you have:

### 1. Rust Installed
```bash
# Check Rust version
rustc --version
cargo --version

# If not installed:
# Windows: https://www.rust-lang.org/tools/install
# Mac: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 2. System Dependencies

**Windows:**
- Visual Studio C++ Build Tools
- WebView2 Runtime (usually pre-installed on Win10/11)

**Mac:**
- Xcode Command Line Tools: `xcode-select --install`

### 3. Node.js & npm
Already installed (same as Electron version)

## Development

```bash
# Install dependencies
npm install

# Run in dev mode (hot reload)
npm run tauri:dev
```

## Building

```bash
# Build for current platform
npm run tauri:build

# Windows
npm run tauri:build:win

# Mac (Apple Silicon)
npm run tauri:build:mac:arm64

# Mac (Intel)
npm run tauri:build:mac:x64

# Mac (Universal)
npm run tauri:build:mac:universal
```

Build outputs will be in: `src-tauri/target/release/bundle/`

## Expected Benefits Over Electron

### Bundle Size
- **Windows:** ~10-15MB (vs 150MB+ with Electron)
- **Mac:** ~5-8MB (vs 120MB+ with Electron)

### Performance
- Lower memory footprint (uses OS native WebView)
- Faster startup time
- Better OS integration

### Security
- More restrictive permissions model
- No Node.js in renderer process
- Better sandboxing

## Architecture Changes

### IPC Communication

**Before (Electron):**
```typescript
await window.electronAPI.readFile(path);
```

**After (Tauri):**
```typescript
import { tauriAPI } from './utils/tauri-api';
await tauriAPI.readFile(path);
```

### Event Listeners

**Before (Electron):**
```typescript
window.electronAPI.onMessageChunk((chunk) => {
  // handle chunk
});
```

**After (Tauri):**
```typescript
const unlisten = await tauriAPI.onMessageChunk((chunk) => {
  // handle chunk
});

// Cleanup
unlisten();
```

### Backend

**Before:** Node.js (electron/main.ts, electron/cli/claude-process.ts)

**After:** Rust (src-tauri/src/commands/*.rs)

## Configuration

### Tauri Config
File: `src-tauri/tauri.conf.json`

Key settings:
- Window dimensions
- App identifier
- Bundle settings
- Plugin permissions

### Rust Dependencies
File: `src-tauri/Cargo.toml`

Main dependencies:
- `tauri` - Core framework
- `tauri-plugin-dialog` - File dialogs
- `tauri-plugin-fs` - File system access
- `tauri-plugin-shell` - Shell commands
- `tokio` - Async runtime
- `serde_json` - JSON parsing
- `ignore` - .gitignore support

## Known Limitations

1. **Claude CLI Required:** Just like Electron version, requires Claude CLI installed and authenticated
2. **Permission Scopes:** Tauri has stricter file system access (configured in tauri.conf.json)
3. **Cross-compilation:** Cannot build Mac apps from Windows (need actual Mac for Mac builds)

## Troubleshooting

### Rust Build Errors
```bash
# Update Rust
rustup update

# Clean build
cd src-tauri
cargo clean
cd ..
npm run tauri:build
```

### Missing WebView2 (Windows)
```bash
winget install Microsoft.EdgeWebView2Runtime
```

### Command Not Found
```bash
# Reinstall Tauri CLI
npm install --save-dev @tauri-apps/cli
```

## Next Steps

1. **Complete frontend migration** - Update all stores and components
2. **Test thoroughly** - All features must work identically to Electron version
3. **Build and test** - Create Windows and Mac builds
4. **Performance testing** - Verify bundle size and memory improvements
5. **User testing** - Ensure no regressions from Electron version

## Documentation

- [Tauri Docs](https://tauri.app/)
- [Tauri API Reference](https://tauri.app/v1/api/js/)
- [Rust Book](https://doc.rust-lang.org/book/)

## Contact

Issues or questions? Check the main project README.

---

**Status:** Backend complete, frontend migration in progress  
**Target Version:** 0.6.0  
**Last Updated:** May 15, 2026
