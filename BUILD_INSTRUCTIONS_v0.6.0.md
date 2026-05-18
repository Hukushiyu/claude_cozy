# Build Instructions - Claude Terminal v0.6.0

**Last Updated:** May 17, 2026  
**Version:** 0.6.0  
**Framework:** Tauri 2.x + React + Rust

---

## Quick Start

### Windows Build
```bash
npm install
npm run tauri:build:win
```
**Output:** `src-tauri/target/release/bundle/nsis/Claude Terminal_0.6.0_x64-setup.exe`

### Mac Build (Universal - Recommended)
```bash
npm install
npm run tauri:build:mac:universal
```
**Output:** `src-tauri/target/release/bundle/dmg/Claude Terminal_0.6.0_universal.dmg`

---

## Prerequisites

### All Platforms
- **Node.js:** 18+ and npm 9+
- **Rust:** Latest stable (install from https://rustup.rs)
- **Claude CLI:** Installed and authenticated (`claude auth login`)

**Check versions:**
```bash
node --version    # Should be 18+
npm --version     # Should be 9+
rustc --version   # Should be 1.70+
cargo --version   # Should be 1.70+
claude --version  # Should be installed
```

### Windows-Specific
- **Microsoft Visual Studio C++ Build Tools**
  ```bash
  winget install Microsoft.VisualStudio.2022.BuildTools
  ```
- **WebView2 Runtime** (usually pre-installed on Windows 10/11)
  ```bash
  winget install Microsoft.EdgeWebView2Runtime
  ```

### Mac-Specific
- **Xcode Command Line Tools**
  ```bash
  xcode-select --install
  ```

---

## Installation Steps

### 1. Extract Build Package
```bash
# Extract claude-terminal-v0.6.0-build.zip
unzip claude-terminal-v0.6.0-build.zip
cd claude-terminal-v0.6.0
```

### 2. Install Dependencies
```bash
npm install
```

This will:
- Install Node.js dependencies (~200MB)
- Download Rust dependencies automatically during build

**Expected time:** 2-5 minutes depending on internet speed

### 3. Verify Setup (Optional)
```bash
# Check if everything compiles
cd src-tauri
cargo check
cd ..
```

Should output: `Finished 'dev' profile target(s)`

---

## Building

### Windows

**Command:**
```bash
npm run tauri:build:win
```

**Build time:** 5-10 minutes (first build), 2-3 minutes (subsequent)

**Output location:**
```
src-tauri/target/release/bundle/nsis/
├── Claude Terminal_0.6.0_x64-setup.exe    (NSIS installer)
└── Claude Terminal_0.6.0_x64-setup.nsis.zip
```

**File sizes:**
- Installer: ~10-15MB
- Installed size: ~20-25MB

**What you get:**
- NSIS installer with Start Menu shortcuts
- Uninstaller in Windows Settings

---

### Mac Builds - IMPORTANT

**⚠️ Cross-compilation limitation:**
Tauri apps with native Rust dependencies (like ours) **cannot** cross-compile between Intel and ARM.

**Your options depend on what Mac you have:**

---

#### Option A: Intel Mac Only (Your Situation)

**Build Intel-only on your Intel Mac:**
```bash
npm run tauri:build:mac:x64
```

**Output:** `Claude Terminal_0.6.0_x64.dmg` (~5-7MB)

**What about ARM Mac users?**
- ARM Macs will run it via **Rosetta 2** (Apple's Intel emulation)
- Slightly slower but works fine
- Most ARM Mac users already have Rosetta 2
- They'll see a one-time prompt: "Install Rosetta 2 to run this app"

**This is acceptable** - many Mac apps still ship Intel-only.

---

#### Option B: ARM Mac Only

**If you have ARM Mac (M1/M2/M3):**
```bash
# ARM-only (smaller file)
npm run tauri:build:mac:arm64

# OR Universal (works on both, larger file)
npm run tauri:build:mac:universal
```

**Output:**
- ARM-only: `Claude Terminal_0.6.0_aarch64.dmg` (~5-7MB)
- Universal: `Claude Terminal_0.6.0_universal.dmg` (~10-12MB)

**Intel Mac users:**
- Universal build works natively on Intel
- ARM-only build does NOT work on Intel

---

#### Option C: GitHub Actions (Recommended for Both)

**Build remotely on GitHub:**

1. Create `.github/workflows/build.yml`:
```yaml
name: Build Apps

on:
  push:
    tags:
      - 'v*'

jobs:
  build-mac-x64:
    runs-on: macos-13  # Intel Mac
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm install
      - run: npm run tauri:build:mac:x64
      - uses: actions/upload-artifact@v3
        with:
          name: mac-x64-dmg
          path: src-tauri/target/release/bundle/dmg/*.dmg

  build-mac-arm64:
    runs-on: macos-14  # ARM Mac (M1)
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm install
      - run: npm run tauri:build:mac:arm64
      - uses: actions/upload-artifact@v3
        with:
          name: mac-arm64-dmg
          path: src-tauri/target/release/bundle/dmg/*.dmg
```

2. Push tag:
```bash
git tag v0.6.0
git push origin v0.6.0
```

3. Download both DMG files from Actions artifacts

**Pros:**
- Build both architectures
- Free for public repos
- Automated

**Cons:**
- Requires GitHub repo
- Takes 15-20 minutes per build

---

### Mac Build Recommendation

**For Intel Mac owners (you):**

**Quick & Easy:**
- Build Intel-only: `npm run tauri:build:mac:x64`
- Ship that DMG
- ARM users use Rosetta 2

**Proper Distribution:**
- Use GitHub Actions
- Build both x64 and arm64
- Distribute both DMGs
- Users download correct one

**File naming:**
```
Claude Terminal_0.6.0_x64.dmg       (Intel Macs)
Claude Terminal_0.6.0_aarch64.dmg   (ARM Macs)
```

---

## Distribution

### Windows
Distribute the NSIS installer:
```
Claude Terminal_0.6.0_x64-setup.exe
```

**User installation:**
1. Double-click installer
2. Follow prompts
3. Launches from Start Menu

**User must have:**
- WebView2 Runtime (auto-installed on Win10/11)
- Claude CLI installed and authenticated

---

### Mac

**Recommended:** Distribute the DMG:
```
Claude Terminal_0.6.0_universal.dmg
```

**User installation:**
1. Double-click DMG
2. Drag app to Applications folder
3. Right-click app → Open (first launch only, due to unsigned app)

**Gatekeeper Warning:**
App is **unsigned**. Users will see: "Apple cannot verify Claude Terminal is free of malware"

**Workaround for users:**
```bash
# Option 1: Right-click → Open (recommended)
# Option 2: Remove quarantine attribute
xattr -cr "/Applications/Claude Terminal.app"
```

**User must have:**
- macOS 10.13+ (High Sierra or later)
- Claude CLI installed and authenticated

---

## Build Troubleshooting

### Windows

**Error: `LINK : fatal error LNK1181`**
- Install Visual Studio C++ Build Tools
- Restart terminal after installation

**Error: `WebView2 not found`**
```bash
winget install Microsoft.EdgeWebView2Runtime
```

**Error: `Access denied` during build**
- Run terminal as Administrator
- Needed for creating symlinks

---

### Mac

**Error: `xcrun: error: unable to find utility "cc"`**
```bash
xcode-select --install
```

**Error: `failed to run custom build command for 'tauri'`**
- Update Xcode Command Line Tools
- Restart terminal

**Error: `Gatekeeper won't open app`**
- This is expected for unsigned apps
- Use right-click → Open method
- Or remove quarantine: `xattr -cr "/Applications/Claude Terminal.app"`

**Error: Can't build universal on Intel Mac**
- Universal builds require ARM Mac
- Build x64-only on Intel Mac instead

---

## Code Signing (Optional)

### Windows
Requires code signing certificate ($100-300/year)

**With certificate:**
```bash
# Add to tauri.conf.json
"windows": {
  "certificateThumbprint": "YOUR_CERT_THUMBPRINT",
  "digestAlgorithm": "sha256",
  "timestampUrl": ""
}
```

### Mac
Requires Apple Developer account ($99/year)

**With certificate:**
```bash
# Sign the app
codesign --force --deep --sign "Developer ID Application: Your Name" "Claude Terminal.app"

# Notarize (submit to Apple)
xcrun notarytool submit "Claude Terminal.dmg" --apple-id "your@email.com" --wait

# Staple notarization
xcrun stapler staple "Claude Terminal.dmg"
```

**Without signing:**
- Distribute as ZIP instead of DMG (more reliable)
- Users use right-click → Open method

---

## Build Optimization

### Faster Builds

**Use release mode with optimizations:**
Already enabled by default in `tauri:build` commands.

**Speed up Rust compilation:**
```bash
# Add to ~/.cargo/config.toml (optional)
[build]
jobs = 8  # Number of CPU cores
```

### Smaller Binaries

**Already optimized:**
- `opt-level = 'z'` (optimize for size)
- `lto = true` (link-time optimization)
- `codegen-units = 1` (better optimization)
- `strip = true` (remove debug symbols)

See `src-tauri/Cargo.toml` profile settings.

---

## Testing the Build

### Windows
```bash
# Run the installer
./src-tauri/target/release/bundle/nsis/Claude\ Terminal_0.6.0_x64-setup.exe

# Or run portable
./src-tauri/target/release/Claude\ Terminal.exe
```

### Mac
```bash
# Mount DMG and test
open ./src-tauri/target/release/bundle/dmg/Claude\ Terminal_0.6.0_universal.dmg

# Or run app directly
./src-tauri/target/release/bundle/macos/Claude\ Terminal.app/Contents/MacOS/Claude\ Terminal
```

### Test Checklist
- [ ] App launches
- [ ] Project selection works
- [ ] Can send messages to Claude
- [ ] File tree loads
- [ ] Settings modal opens
- [ ] Clear History button works
- [ ] App icon displays correctly
- [ ] Window can be resized/moved

---

## Clean Build

If you need to rebuild from scratch:

```bash
# Clean all build artifacts
npm run tauri clean

# Or manually
rm -rf node_modules dist src-tauri/target
npm install
npm run tauri:build
```

---

## Build Sizes Comparison

| Platform | Size | Installed Size |
|----------|------|----------------|
| Windows (NSIS) | ~12MB | ~25MB |
| Mac Universal | ~10MB | ~20MB |
| Mac ARM only | ~6MB | ~10MB |
| Mac Intel only | ~7MB | ~12MB |

**For comparison:**
- Electron version: 150MB+ (Windows), 120MB+ (Mac)
- **Tauri savings: ~90% smaller!**

---

## CI/CD Notes

### GitHub Actions Build

**Windows:**
```yaml
- name: Build Windows
  run: npm run tauri:build:win
  
- uses: actions/upload-artifact@v3
  with:
    name: windows-installer
    path: src-tauri/target/release/bundle/nsis/*.exe
```

**Mac Universal:**
```yaml
- name: Build Mac Universal
  run: npm run tauri:build:mac:universal
  
- uses: actions/upload-artifact@v3
  with:
    name: mac-dmg
    path: src-tauri/target/release/bundle/dmg/*.dmg
```

**Runners needed:**
- `windows-latest` for Windows build
- `macos-latest` (ARM M1) for Mac universal build

---

## Version Bumping

Before building new version:

1. **Update version in both files:**
   ```bash
   # package.json
   "version": "0.6.0"
   
   # src-tauri/Cargo.toml
   version = "0.6.0"
   
   # src-tauri/tauri.conf.json
   "version": "0.6.0"
   ```

2. **Update version display in app:**
   ```typescript
   // src/components/layout/AppShell.tsx
   <div className="text-xs mt-1">
     v0.6.0
   </div>
   ```

3. **Tag release:**
   ```bash
   git tag v0.6.0
   git push origin v0.6.0
   ```

---

## Known Build Issues

### Windows
- **Issue:** Administrator required for build
- **Reason:** Symlink creation in node_modules
- **Fix:** Run terminal as Administrator

### Mac
- **Issue:** "App is damaged" message
- **Reason:** Gatekeeper quarantine on unsigned app
- **Fix:** `xattr -cr "/Applications/Claude Terminal.app"`

### Universal Build
- **Issue:** Very large file size
- **Reason:** Contains both Intel and ARM binaries
- **Tradeoff:** Convenience vs size (choose universal for easier distribution)

---

## Support

**Build issues?**
1. Check prerequisites are installed
2. Run `cargo check` to verify Rust setup
3. Check build logs in `src-tauri/target/`
4. Create issue with:
   - OS and version
   - Node/Rust versions
   - Full error message
   - Build command used

**Distribution issues?**
- Windows: Ensure WebView2 is available
- Mac: Provide right-click → Open instructions for unsigned apps

---

## Files Included in Build Package

```
claude-terminal-v0.6.0/
├── src/                          # React frontend source
├── src-tauri/                    # Rust backend source
├── public/                       # Static assets
├── package.json                  # Node dependencies
├── package-lock.json            # Locked dependency versions
├── tsconfig.json                # TypeScript config
├── vite.config.ts               # Vite build config
├── tailwind.config.js           # Tailwind CSS config
├── postcss.config.js            # PostCSS config
├── BUILD_INSTRUCTIONS_v0.6.0.md # This file
├── CLAUDE.md                    # Developer documentation
├── QUICK_START.md               # User guide
└── CLI_HISTORY_INTEGRATION_COMPLETE.md  # Technical docs
```

**Not included:**
- `node_modules/` (install via `npm install`)
- `dist/` (build output)
- `src-tauri/target/` (build output)
- `.git/` (version control)

---

**Ready to build!** 🚀

Start with `npm install` then choose your platform's build command above.
