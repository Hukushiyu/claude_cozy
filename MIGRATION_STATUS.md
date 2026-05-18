# Tauri Migration Status

## Summary

The Tauri migration has begun! The entire **Rust backend is complete** and ready to go. All Claude CLI integration, file operations, history management, and git status features have been ported to Rust.

The **frontend migration** is next - we need to update the React components and stores to use the new Tauri API instead of Electron.

---

## ✅ Phase 1: Setup & Backend (COMPLETE)

### Tauri Initialization
- ✅ Created `Tauri Builds/` folder
- ✅ Copied all source files from Electron version
- ✅ Installed npm dependencies (Tauri packages)
- ✅ Initialized Tauri project (`npx tauri init`)
- ✅ Updated `package.json` with Tauri scripts
- ✅ Updated `vite.config.ts` for Tauri
- ✅ Configured `src-tauri/tauri.conf.json`
- ✅ Copied app icons to `src-tauri/icons/`

### Rust Backend Commands
All commands implemented in `src-tauri/src/commands/`:

#### **project.rs**
- `select_project()` - Opens folder picker dialog

#### **files.rs**
- `read_file(file_path)` - Read file contents
- `write_file(file_path, content)` - Write file contents
- `load_file_tree(path)` - Load directory tree with .gitignore support
- `create_file(file_path)` - Create new file
- `create_folder(folder_path)` - Create new folder
- `rename_file(old_path, new_path)` - Rename file/folder
- `delete_file(file_path)` - Delete file/folder

#### **chat.rs** (Most Complex)
- `send_message(message, project_path, model, skip_permissions)` - Send message to Claude CLI
  - Spawns `claude` process with streaming JSON output
  - Emits events: `chat:chunk`, `chat:thinking`, `chat:tool`, `chat:result`, `chat:error`
  - Handles rate limits and retries
- `kill_claude_process()` - Stop current Claude process

#### **history.rs**
- `save_history(project_path, history)` - Save conversation to `.claude-desktop/history.json`
- `load_history(project_path)` - Load conversation from disk
- `archive_history(project_path)` - Archive current history with timestamp
- `clear_history(project_path)` - Clear conversation history

#### **git.rs**
- `get_git_status(project_path)` - Get git status (modified/added/deleted files)

#### **cli.rs**
- `check_claude_status()` - Check if Claude CLI is installed and authenticated
- `open_terminal_for_auth()` - Open terminal for `claude auth login` (Windows/Mac/Linux)

### Rust Dependencies Configured
In `src-tauri/Cargo.toml`:
- `tauri` - Core framework
- `tauri-plugin-dialog` - File dialogs
- `tauri-plugin-fs` - File system
- `tauri-plugin-shell` - Shell commands
- `tokio` - Async runtime for streaming
- `serde` / `serde_json` - JSON parsing
- `ignore` - .gitignore support
- `lazy_static` - Global state management
- `chrono` - Timestamp formatting

### Frontend API Wrapper Created
- ✅ `src/utils/tauri-api.ts` - Complete Tauri API wrapper matching Electron API surface

---

## ⏳ Phase 2: Frontend Migration (IN PROGRESS)

### What Needs to Change

The frontend currently uses `window.electronAPI` everywhere. We need to update it to use `tauriAPI` instead.

### Files That Need Updates

#### **1. Stores** (Priority: HIGH)
These manage state and make IPC calls:

- `src/stores/chatStore.ts`
  - Replace `window.electronAPI.sendMessage()` with `tauriAPI.sendMessage()`
  - Replace `window.electronAPI.saveHistory()` with `tauriAPI.saveHistory()`
  - Replace `window.electronAPI.resetPermissions()` (handle differently in Tauri)
  - Add `projectPath` and `model` parameters to sendMessage calls

- `src/stores/fileTreeStore.ts`
  - Replace `window.electronAPI.loadFileTree()` with `tauriAPI.loadFileTree()`
  - Replace `window.electronAPI.loadDirectory()` with `tauriAPI.loadDirectory()`
  - Update file operations (create/rename/delete)

- `src/stores/projectStore.ts`
  - Replace `window.electronAPI.selectProject()` with `tauriAPI.selectProject()`
  - Replace `window.electronAPI.checkClaudeCli()` with `tauriAPI.checkClaudeCli()`
  - Replace `window.electronAPI.loadHistory()` with `tauriAPI.loadHistory()`

- `src/stores/settingsStore.ts`
  - Settings are stored in localStorage (no changes needed)

#### **2. Components** (Priority: MEDIUM)
These use event listeners:

- `src/components/chat/ChatInterface.tsx`
  - Replace event listeners:
    - `window.electronAPI.onMessageChunk()` → `await tauriAPI.onMessageChunk()`
    - `window.electronAPI.onMessageComplete()` → `await tauriAPI.onMessageComplete()`
    - `window.electronAPI.onChatError()` → `await tauriAPI.onChatError()`
    - `window.electronAPI.onThinkingStatus()` → `await tauriAPI.onThinkingStatus()`
    - `window.electronAPI.onToolEvent()` → `await tauriAPI.onToolEvent()`
  - **Important:** Tauri listeners return `UnlistenFn` - must call in cleanup:
    ```typescript
    useEffect(() => {
      let unlistenChunk: UnlistenFn | null = null;
      
      tauriAPI.onMessageChunk((chunk) => {
        // handle chunk
      }).then(fn => { unlistenChunk = fn; });
      
      return () => {
        if (unlistenChunk) unlistenChunk();
      };
    }, []);
    ```

- `src/components/file-tree/FileTree.tsx`
  - Replace `window.electronAPI.getGitStatus()` with `tauriAPI.getGitStatus()`
  - File operations already use store methods (should be fine)

- `src/components/layout/AppShell.tsx`
  - Replace `window.electronAPI.openTerminalForAuth()` with `tauriAPI.openTerminalForAuth()`
  - Replace `window.electronAPI.checkClaudeCli()` with `tauriAPI.checkClaudeCli()`

#### **3. Type Definitions** (Priority: LOW)
- `src/types/ipc.ts` - May need updates for Tauri-specific types
- Can create `src/types/tauri.ts` for Tauri-specific types if needed

### Permission Handling Changes

**Electron:** Had a complex permission modal system with approve/deny

**Tauri:** We're using `--dangerously-skip-permissions` flag based on setting
- Add a setting: "Always approve tool use"
- Pass `skipPermissions` boolean to `sendMessage()`
- Simpler UX - no mid-message interruptions

---

## 🎯 Next Steps

### Immediate (Today)
1. **Update chatStore.ts** - Most critical, handles sending messages
2. **Update ChatInterface.tsx** - Event listeners need async/await pattern
3. **Test basic chat** - Can we send a message and get a response?

### Short-term (This Week)
4. **Update projectStore.ts** - Project selection and history loading
5. **Update fileTreeStore.ts** - File tree operations
6. **Update remaining components** - File tree, app shell
7. **Test all features** - Ensure feature parity with Electron version

### Testing Checklist
- [ ] Project folder selection works
- [ ] File tree loads and displays
- [ ] Chat sends messages to Claude CLI
- [ ] Streaming responses display correctly
- [ ] Thinking indicators show
- [ ] Tool execution works
- [ ] Conversation history saves/loads
- [ ] Git status indicators work
- [ ] Settings persist
- [ ] Theme changes apply
- [ ] CLI authentication check works
- [ ] Terminal launcher opens

### Build & Distribution
8. **Build for Windows** - `npm run tauri:build:win`
9. **Build for Mac** - `npm run tauri:build:mac:universal` (on Mac)
10. **Compare bundle sizes** - Should be ~90% smaller than Electron
11. **Performance testing** - Memory usage, startup time

---

## Key Differences: Electron vs Tauri

| Feature | Electron | Tauri |
|---------|----------|-------|
| **Backend** | Node.js | Rust |
| **IPC** | `ipcMain`/`ipcRenderer` | `#[tauri::command]` / `invoke()` |
| **Events** | `webContents.send()` / `ipcRenderer.on()` | `window.emit()` / `listen()` |
| **Event Cleanup** | `removeAllListeners()` | Call `unlisten()` function |
| **Preload Script** | Required (`preload.ts`) | Not needed |
| **Process Model** | Multi-process | Single-process |
| **Bundle Size** | 150MB+ | 10-20MB |
| **Memory** | High (bundled Chromium) | Low (OS WebView) |

---

## Important Notes

### Event Listener Pattern

**Electron (old):**
```typescript
useEffect(() => {
  window.electronAPI.onMessageChunk((chunk) => {
    // handle
  });
  
  return () => {
    window.electronAPI.removeAllListeners('chat:chunk');
  };
}, []);
```

**Tauri (new):**
```typescript
useEffect(() => {
  let unlisten: UnlistenFn | null = null;
  
  // Listeners return promises that resolve to unlisten function
  tauriAPI.onMessageChunk((chunk) => {
    // handle
  }).then(fn => { unlisten = fn; });
  
  return () => {
    if (unlisten) unlisten();
  };
}, []);
```

### sendMessage Signature Change

**Electron:**
```typescript
sendMessage(content: string)
// Project path stored in state
```

**Tauri:**
```typescript
sendMessage(message: string, projectPath: string, model: string, skipPermissions: boolean)
// All context passed explicitly
```

---

## Build Commands Reference

```bash
# Development (hot reload)
npm run tauri:dev

# Build current platform
npm run tauri:build

# Windows
npm run tauri:build:win

# Mac Apple Silicon
npm run tauri:build:mac:arm64

# Mac Intel
npm run tauri:build:mac:x64

# Mac Universal
npm run tauri:build:mac:universal
```

---

## Questions to Resolve

1. **Permission System:** Do we want a setting toggle or always skip permissions?
2. **Model Selection:** Should model be in settings or per-message?
3. **History Location:** Keep in `.claude-desktop/` or use app data dir?

---

**Current Status:** Phase 1 complete (backend), Phase 2 starting (frontend)  
**Next Action:** Update chatStore.ts to use tauriAPI  
**Target Completion:** End of week  
**Version:** 0.6.0
