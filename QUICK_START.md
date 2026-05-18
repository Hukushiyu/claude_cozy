# Tauri Migration - Quick Start Guide

## 🎯 What's Been Done

The **entire Rust backend is complete!** All Claude CLI integration, file operations, and state management have been ported from Node.js to Rust.

### Completed ✅
- Tauri project initialized with all necessary plugins
- 6 Rust command modules created (`project`, `files`, `chat`, `history`, `git`, `cli`)
- Frontend API wrapper created (`src/utils/tauri-api.ts`)
- All dependencies configured

### What's Next ⏳
- Update React components/stores to use `tauriAPI` instead of `window.electronAPI`
- Update event listener patterns (Tauri returns unlisten functions)
- Test all features work identically to Electron version

---

## 🚀 How to Continue

### Step 1: Verify Rust Backend Compiles

```bash
cd "Tauri Builds/src-tauri"
cargo check
```

Should see: `Finished 'dev' profile [unoptimized + debuginfo] target(s)`

### Step 2: Update Frontend Stores

Priority order:

1. **chatStore.ts** - Most critical
   ```typescript
   // Change from:
   await window.electronAPI.sendMessage(content);
   
   // To:
   import { tauriAPI } from '../utils/tauri-api';
   const projectPath = useProjectStore.getState().projectPath;
   const model = useSettingsStore.getState().model || 'claude-sonnet-4-6';
   await tauriAPI.sendMessage(content, projectPath, model, false);
   ```

2. **ChatInterface.tsx** - Event listeners
   ```typescript
   // Change from:
   useEffect(() => {
     window.electronAPI.onMessageChunk((chunk) => {
       chatStore.appendChunk(chunk);
     });
     return () => {
       window.electronAPI.removeAllListeners('chat:chunk');
     };
   }, []);
   
   // To:
   useEffect(() => {
     let unlisten: UnlistenFn | null = null;
     
     tauriAPI.onMessageChunk((chunk) => {
       chatStore.appendChunk(chunk);
     }).then(fn => { unlisten = fn; });
     
     return () => {
       if (unlisten) unlisten();
     };
   }, []);
   ```

3. **projectStore.ts** - Project selection
4. **fileTreeStore.ts** - File operations

### Step 3: Test Development Mode

```bash
npm run tauri:dev
```

This will:
1. Start Vite dev server on port 1420
2. Compile Rust backend
3. Launch Tauri window with hot reload

### Step 4: Test Features

- [ ] Select a project folder
- [ ] File tree loads
- [ ] Send a message to Claude
- [ ] Response streams back
- [ ] History saves/loads
- [ ] Git status works
- [ ] Settings persist

### Step 5: Build for Distribution

```bash
# Windows
npm run tauri:build:win

# Mac (run on Mac)
npm run tauri:build:mac:universal
```

Output: `src-tauri/target/release/bundle/`

---

## 📁 Project Structure

```
Tauri Builds/
├── src/                          # React frontend (needs updates)
│   ├── components/               # Update to use tauriAPI
│   ├── stores/                   # Update to use tauriAPI
│   ├── utils/
│   │   └── tauri-api.ts         # ✅ New Tauri wrapper (complete)
│   └── types/
│       └── ipc.ts               # May need minor updates
│
├── src-tauri/                    # ✅ Rust backend (COMPLETE)
│   ├── src/
│   │   ├── main.rs              # Entry point
│   │   ├── lib.rs               # App setup + command registration
│   │   └── commands/
│   │       ├── project.rs       # ✅ Folder picker
│   │       ├── files.rs         # ✅ File tree, CRUD ops
│   │       ├── chat.rs          # ✅ Claude CLI integration
│   │       ├── history.rs       # ✅ Save/load/archive
│   │       ├── git.rs           # ✅ Git status
│   │       └── cli.rs           # ✅ Auth check, terminal
│   ├── Cargo.toml               # ✅ Dependencies configured
│   └── tauri.conf.json          # ✅ App config
│
├── package.json                  # ✅ Tauri scripts added
├── vite.config.ts               # ✅ Updated for Tauri
├── TAURI_README.md              # Full documentation
├── MIGRATION_STATUS.md          # Detailed status
└── QUICK_START.md               # This file
```

---

## 🔧 Command Reference

```bash
# Install dependencies
npm install

# Check Rust compiles
cd src-tauri && cargo check

# Development (hot reload)
npm run tauri:dev

# Build current platform
npm run tauri:build

# Build Windows
npm run tauri:build:win

# Build Mac (Apple Silicon)
npm run tauri:build:mac:arm64

# Build Mac (Intel)
npm run tauri:build:mac:x64

# Build Mac (Universal)
npm run tauri:build:mac:universal
```

---

## 🐛 Common Issues

### "rustc not found"
```bash
# Install Rust
# Windows: https://www.rust-lang.org/tools/install
# Mac: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### "WebView2 not found" (Windows)
```bash
winget install Microsoft.EdgeWebView2Runtime
```

### TypeScript errors in frontend
Normal - they'll go away once we update the stores to use `tauriAPI`

### Rust compilation errors
Check `src-tauri/Cargo.toml` dependencies are correct and run:
```bash
cd src-tauri
cargo clean
cargo check
```

---

## 📊 Expected Improvements

### Bundle Size
- **Electron:** 150MB+ (Windows), 120MB+ (Mac)
- **Tauri:** 10-15MB (Windows), 5-8MB (Mac)
- **Savings:** ~90% smaller

### Memory Usage
- **Electron:** 300-500MB idle
- **Tauri:** 50-150MB idle
- **Savings:** ~70% less memory

### Startup Time
- **Electron:** 2-4 seconds
- **Tauri:** < 1 second
- **Improvement:** 2-4x faster

---

## 📝 Key Differences

| Aspect | Electron | Tauri |
|--------|----------|-------|
| Backend Language | JavaScript/Node.js | Rust |
| Renderer | Chromium (bundled) | OS WebView |
| IPC | `ipcMain`/`ipcRenderer` | `invoke()` |
| Event Cleanup | `removeListener()` | `unlisten()` |
| Bundle Size | 150MB+ | 10-20MB |
| Security | Good | Better |

---

## 🎯 Success Criteria

Before considering migration complete:

1. ✅ Rust backend compiles without errors
2. ⏳ All frontend stores updated
3. ⏳ All event listeners use unlisten pattern
4. ⏳ `npm run tauri:dev` launches successfully
5. ⏳ All features work identically to Electron
6. ⏳ Builds successfully for Windows and Mac
7. ⏳ Bundle size is <20MB
8. ⏳ No performance regressions

---

## 📚 Resources

- **Tauri Docs:** https://tauri.app/
- **Tauri API:** https://tauri.app/v1/api/js/
- **Rust Book:** https://doc.rust-lang.org/book/
- **Migration Checklist:** See `../TAURI_MIGRATION_CHECKLIST.md`

---

## 💡 Tips

1. **Start with chat** - Get basic message sending working first
2. **One store at a time** - Don't update everything at once
3. **Test frequently** - Run `npm run tauri:dev` after each change
4. **Check console** - Tauri logs errors to browser devtools
5. **Use TypeScript** - Catch API mismatches before runtime

---

**Status:** Backend complete, frontend migration starting  
**Next:** Update `chatStore.ts` and `ChatInterface.tsx`  
**Version:** 0.6.0  
**Date:** May 15, 2026
