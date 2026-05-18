# Claude Terminal v0.6.0 - Build Package

**Version:** 0.6.0  
**Package:** `claude-terminal-v0.6.0-build.tar.gz`  
**Size:** ~1MB  
**Created:** May 17, 2026

---

## What's Included

This package contains everything needed to build Claude Terminal v0.6.0 executables for Windows and Mac.

### Source Code
- `src/` - React frontend (TypeScript + Tailwind)
- `src-tauri/` - Rust backend (Tauri commands)
- `public/` - Static assets
- `build/` - App icons

### Configuration Files
- `package.json` - Node.js dependencies and build scripts
- `package-lock.json` - Locked dependency versions
- `tsconfig.json` - TypeScript compiler config
- `vite.config.ts` - Build tool configuration
- `tailwind.config.js` - CSS framework config
- `postcss.config.js` - CSS processing config

### Documentation
- **`BUILD_INSTRUCTIONS_v0.6.0.md`** - **START HERE** - Complete build guide
- `CLAUDE.md` - Developer documentation
- `QUICK_START.md` - User guide
- `CLI_HISTORY_INTEGRATION_COMPLETE.md` - Technical details on v0.6.0 feature
- `CLEAR_HISTORY_BUTTON_ADDED.md` - Clear History button implementation

### Not Included (Will Be Generated)
- `node_modules/` - Install via `npm install` (~200MB)
- `dist/` - Frontend build output
- `src-tauri/target/` - Rust build output and executables

---

## Quick Start

### 1. Extract Package
```bash
# Windows
tar -xzf claude-terminal-v0.6.0-build.tar.gz
cd claude-terminal-v0.6.0

# Mac
tar -xzf claude-terminal-v0.6.0-build.tar.gz
cd claude-terminal-v0.6.0
```

### 2. Install Dependencies
```bash
npm install
```
**Time:** 2-5 minutes  
**Size:** ~200MB in node_modules/

### 3. Build

**Windows:**
```bash
npm run tauri:build:win
```
**Output:** `src-tauri/target/release/bundle/nsis/Claude Terminal_0.6.0_x64-setup.exe`

**Mac (Intel):**
```bash
npm run tauri:build:mac:x64
```
**Output:** `src-tauri/target/release/bundle/dmg/Claude Terminal_0.6.0_x64.dmg`

**Mac (ARM):**
- See BUILD_INSTRUCTIONS_v0.6.0.md
- Cannot build ARM from Intel Mac (use GitHub Actions)

---

## Prerequisites

**Required on build machine:**
- Node.js 18+ and npm 9+
- Rust (latest stable from https://rustup.rs)
- Claude CLI (installed and authenticated)

**Platform-specific:**
- **Windows:** Visual Studio C++ Build Tools, WebView2
- **Mac:** Xcode Command Line Tools

**Check prerequisites:**
```bash
node --version     # 18+
npm --version      # 9+
rustc --version    # 1.70+
claude --version   # Installed
```

---

## Build Times & Sizes

### Build Times
- **First build:** 5-10 minutes (downloads Rust dependencies)
- **Subsequent builds:** 2-3 minutes (incremental)

### Output Sizes
- **Windows installer:** ~12MB
- **Mac DMG (x64):** ~6MB
- **Mac DMG (arm64):** ~6MB
- **Mac DMG (universal):** ~10MB

### Installed Sizes
- **Windows:** ~25MB
- **Mac:** ~10-20MB

**For comparison:**
- Previous Electron version: 150MB+ (Windows), 120MB+ (Mac)
- **Tauri savings: ~90% smaller!**

---

## What's New in v0.6.0

### CLI History Integration
- ✅ GUI and CLI now share same history storage (`~/.claude/projects/`)
- ✅ "Clear History" actually clears CLI context (uses `claude project purge`)
- ✅ Single source of truth - no more duplicate history systems
- ✅ Backend supports session browsing (UI pending)

### Clear History Button
- ✅ Added to header with confirmation modal
- ✅ Red-themed destructive action styling
- ✅ Warning about permanent deletion
- ✅ Proper loading states

### Dark Warm Theme
- ✅ New dark mode option with brown tones
- ✅ Less contrast than original dark theme

---

## Distribution

After building, distribute these files:

**Windows:**
```
Claude Terminal_0.6.0_x64-setup.exe
```

**Mac:**
```
Claude Terminal_0.6.0_x64.dmg          (Intel Macs)
Claude Terminal_0.6.0_aarch64.dmg      (ARM Macs, if built)
```

### User Requirements
- **Windows:** WebView2 Runtime (usually pre-installed)
- **Mac:** macOS 10.13+ (High Sierra or later)
- **Both:** Claude CLI installed and authenticated

### Mac Unsigned App Warning
Users will see: "Apple cannot verify Claude Terminal is free of malware"

**User workaround:**
- Right-click → Open (first launch only)
- Or: `xattr -cr "/Applications/Claude Terminal.app"`

---

## Important Notes

### Mac Cross-Compilation
**⚠️ Cannot build ARM from Intel Mac (or vice versa)**

Your options:
1. **Build Intel-only** (ARM users use Rosetta 2)
2. **Use GitHub Actions** to build both architectures remotely
3. **Build on ARM Mac** if you have access to one

See BUILD_INSTRUCTIONS_v0.6.0.md for GitHub Actions workflow.

### Code Signing
This build is **unsigned**.

**To sign (optional):**
- **Windows:** Requires code signing certificate ($100-300/year)
- **Mac:** Requires Apple Developer account ($99/year)

See BUILD_INSTRUCTIONS_v0.6.0.md for signing instructions.

---

## Troubleshooting

### Build Fails
1. Check prerequisites installed: `node --version`, `rustc --version`, `claude --version`
2. Run `cd src-tauri && cargo check` to verify Rust setup
3. Clean and rebuild: `rm -rf node_modules dist src-tauri/target && npm install`

### "Administrator required" (Windows)
- Run terminal as Administrator
- Needed for creating symlinks in node_modules

### "xcrun: error" (Mac)
```bash
xcode-select --install
```

### "WebView2 not found" (Windows)
```bash
winget install Microsoft.EdgeWebView2Runtime
```

---

## File Structure

```
claude-terminal-v0.6.0/
├── src/
│   ├── components/          # React UI components
│   ├── stores/              # Zustand state management
│   ├── utils/               # Tauri API wrapper
│   ├── types/               # TypeScript definitions
│   ├── styles/              # Global CSS
│   └── assets/              # Images, icons
├── src-tauri/
│   ├── src/
│   │   ├── commands/        # Rust IPC handlers
│   │   │   ├── chat.rs      # Claude CLI integration
│   │   │   ├── history.rs   # CLI history management
│   │   │   ├── files.rs     # File operations
│   │   │   ├── project.rs   # Project selection
│   │   │   ├── git.rs       # Git status
│   │   │   └── cli.rs       # CLI checks
│   │   ├── main.rs          # Rust entry point
│   │   └── lib.rs           # Command registration
│   ├── Cargo.toml           # Rust dependencies
│   └── tauri.conf.json      # Tauri configuration
├── public/                   # Static assets
├── build/                    # App icons
├── package.json             # Node dependencies & scripts
└── [config files]           # TypeScript, Vite, Tailwind
```

---

## Support

**Questions about building?**
- Read BUILD_INSTRUCTIONS_v0.6.0.md (comprehensive guide)
- Check prerequisites are installed
- Review build logs in `src-tauri/target/`

**Issues with the app?**
- Check CLAUDE.md for architecture details
- Review CLI_HISTORY_INTEGRATION_COMPLETE.md for v0.6.0 changes

---

## License

MIT License

---

## Version History

**v0.6.0 (May 17, 2026)**
- CLI history integration (true parity with CLI)
- Clear History button with confirmation
- Dark Warm theme
- Bug fixes and optimizations

**v0.5.2 (May 12, 2026)**
- Error recovery system
- Enhanced authentication flow
- Drag & drop file references (Phase 1)

**v0.5.1 (May 7, 2026)**
- Model selector
- Assistant name customization
- CLI authentication checks

**v0.5.0 (May 6, 2026)**
- Initial Tauri migration from Electron
- Theme system
- File tree with operations
- Streaming chat integration

---

**Ready to build!** 🚀

Extract the package and follow BUILD_INSTRUCTIONS_v0.6.0.md to get started.
