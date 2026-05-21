# Manual Mac Build Instructions

Guide for building Claude Cozy locally on your Mac when GitHub Actions runners are unavailable.

---

## 🔐 Setting Up Your Certificates & Keys (Do This First!)

If you want to sign and notarize your build, you need to import your certificates and keys.

### Step 1: Transfer Files to Your Mac

Copy these files from your other computer to your Mac:
- `certificate.p12` (your Developer ID certificate)
- `AuthKey_XXXXXXXXXX.p8` (your App Store Connect API key)

**Transfer methods:**
- AirDrop
- USB drive
- Email to yourself (secure if temporary)
- Cloud storage (Google Drive, Dropbox, etc.)

### Step 2: Import the .p12 Certificate

**Method 1: Double-click (Easy)**
1. Double-click `certificate.p12` on your Mac
2. You'll be prompted for the certificate password
3. Enter the password you set when exporting the certificate
4. The certificate will be imported to your **login** keychain

**Method 2: Command line**
```bash
# Import certificate to login keychain
security import certificate.p12 -k ~/Library/Keychains/login.keychain-db

# You'll be prompted for:
# 1. The certificate password
# 2. Your Mac login password (to allow the import)
```

**Verify it imported:**
```bash
security find-identity -v -p codesigning
```

You should see something like:
```
1) ABC123... "Developer ID Application: Your Name (TEAM123)"
```

Copy the full identity name in quotes - you'll need it for signing!

### Step 3: Save Your API Key Details

The `.p8` file stays as a file - you don't "import" it like the certificate.

**Extract the details you need:**

1. **Key ID** - Found in the filename:
   ```
   AuthKey_ABC123DEFG.p8
            ^^^^^^^^^^
            This is your Key ID
   ```

2. **Issuer ID** - Get from App Store Connect:
   - Go to: https://appstoreconnect.apple.com/access/api
   - Click "Keys" tab
   - Look at the top for "Issuer ID" (UUID format: 12345678-1234-1234-1234-123456789012)

3. **Save the file path** - Put the `.p8` file somewhere safe:
   ```bash
   # Create a secure directory
   mkdir -p ~/.apple-keys
   
   # Move the key file there
   mv ~/Downloads/AuthKey_ABC123DEFG.p8 ~/.apple-keys/
   
   # Secure the permissions
   chmod 600 ~/.apple-keys/AuthKey_ABC123DEFG.p8
   ```

**Write these down (you'll need them later):**
- ✅ Key file path: `~/.apple-keys/AuthKey_ABC123DEFG.p8`
- ✅ Key ID: `ABC123DEFG`
- ✅ Issuer ID: `12345678-1234-1234-1234-123456789012`
- ✅ Signing Identity: `Developer ID Application: Your Name (TEAM123)`

### Step 4: Delete the Certificate After Import (Security)

Once imported to Keychain, delete the `.p12` file:
```bash
# ONLY do this after verifying the import worked!
rm ~/Downloads/certificate.p12
```

The certificate is now safely stored in your Mac's Keychain.

**⚠️ Keep the `.p8` file** - You need this file for notarization. Just keep it secure in `~/.apple-keys/`.

---

## 📋 Prerequisites

### 1. Install Homebrew (if not already installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Node.js & npm
```bash
brew install node@18
# Verify installation
node --version  # Should show v18.x.x
npm --version
```

### 3. Install Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# Follow the prompts (default options are fine)

# Reload your shell
source $HOME/.cargo/env

# Verify installation
rustc --version
cargo --version
```

### 4. Install Xcode Command Line Tools
```bash
xcode-select --install
# Follow the prompts to install
```

### 5. Install Tauri CLI Dependencies
```bash
# Install additional dependencies
brew install pkg-config
```

---

## 🚀 Build Steps

### Step 1: Clone the Repository
```bash
cd ~/Desktop  # Or wherever you want to work
git clone https://github.com/Hukushiyu/claude_terminal.git
cd claude_terminal
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install all Node.js dependencies. It may take a few minutes.

### Step 3: Build for Intel Mac
```bash
npm run tauri:build:mac:x64
```

**This will take 10-15 minutes** on first build. You'll see:
- Rust compiling the backend
- Vite building the frontend
- Tauri bundling everything together

### Step 4: Find Your Build
When complete, your build artifacts will be at:

```bash
cd src-tauri/target/x86_64-apple-darwin/release/bundle
```

**You'll find:**
- `macos/Claude Cozy.app` - The application bundle
- `dmg/Claude Cozy_0.6.8_x64.dmg` - The DMG installer (if DMG build succeeded)

---

## 🔐 Code Signing (Optional)

If you want to sign the app with your Developer ID:

### Prerequisites:
1. Your Developer ID Application certificate must be installed in Keychain Access
2. You need to know your signing identity name

### Find Your Signing Identity:
```bash
security find-identity -v -p codesigning
```

Look for something like:
```
1) ABC123... "Developer ID Application: Your Name (TEAM123)"
```

### Sign the App:
```bash
cd src-tauri/target/x86_64-apple-darwin/release/bundle/macos

codesign --force --deep --sign "Developer ID Application: Your Name (TEAM123)" "Claude Cozy.app"

# Verify it worked
codesign -dv --verbose=4 "Claude Cozy.app"
```

---

## 🍎 Notarization (Optional)

If you want to notarize the app (removes Gatekeeper warnings):

### Prerequisites:
1. App Store Connect API key (`.p8` file)
2. API Key ID
3. Issuer ID

### Notarize:
```bash
cd src-tauri/target/x86_64-apple-darwin/release/bundle/macos

# Create a zip for notarization
ditto -c -k --keepParent "Claude Cozy.app" "Claude_Cozy_notarize.zip"

# Submit for notarization
xcrun notarytool submit "Claude_Cozy_notarize.zip" \
  --key /path/to/AuthKey_ABC123.p8 \
  --key-id ABC123DEFG \
  --issuer 12345678-1234-1234-1234-123456789012 \
  --wait

# If successful, staple the ticket
xcrun stapler staple "Claude Cozy.app"

# Verify
xcrun stapler validate "Claude Cozy.app"
spctl -a -vv -t install "Claude Cozy.app"
```

---

## 📦 Create DMG Manually (if needed)

If the DMG didn't build automatically:

```bash
cd src-tauri/target/x86_64-apple-darwin/release/bundle

# Create a simple DMG
hdiutil create -volname "Claude Cozy" \
  -srcfolder "macos/Claude Cozy.app" \
  -ov -format UDZO \
  "Claude_Cozy_0.6.8_x64.dmg"
```

---

## 📤 Create ZIP for Distribution

```bash
cd src-tauri/target/x86_64-apple-darwin/release/bundle/macos

zip -ry ../Claude.Cozy_0.6.8_x64.zip "Claude Cozy.app"

# Your ZIP is now at:
# src-tauri/target/x86_64-apple-darwin/release/bundle/Claude.Cozy_0.6.8_x64.zip
```

---

## 🧪 Test the Build

```bash
cd src-tauri/target/x86_64-apple-darwin/release/bundle/macos

# Open the app
open "Claude Cozy.app"

# Or install to Applications
cp -R "Claude Cozy.app" /Applications/
open /Applications/"Claude Cozy.app"
```

---

## 🐛 Troubleshooting

### "xcrun: error: unable to find utility 'notarytool'"
You need macOS 12+ for notarytool. For older macOS:
```bash
xcrun altool --notarize-app ...
# (See Apple docs for altool syntax)
```

### "cargo: command not found"
Restart your terminal or run:
```bash
source $HOME/.cargo/env
```

### Build fails with "No such file or directory"
Make sure you're in the project root:
```bash
cd ~/Desktop/claude_terminal
ls -la  # Should see package.json, src-tauri/, etc.
```

### "Failed to bundle project"
Check that Xcode Command Line Tools are installed:
```bash
xcode-select -p
# Should show: /Library/Developer/CommandLineTools
```

### Build succeeds but app won't open
Check for signing/notarization issues:
```bash
codesign -dv "Claude Cozy.app"
spctl -a -vv "Claude Cozy.app"
```

If unsigned, users need to right-click → Open (first time).

---

## 📊 Build Artifacts Summary

After a successful build:

```
src-tauri/target/x86_64-apple-darwin/release/bundle/
├── macos/
│   └── Claude Cozy.app         # The actual app
├── dmg/
│   └── Claude Cozy_0.6.8_x64.dmg  # DMG installer
└── Claude.Cozy_0.6.8_x64.zip    # ZIP archive (if you created it)
```

**For distribution, you want:**
- The DMG file (easier for users)
- OR the ZIP file (more reliable for unsigned apps)

---

## 🚢 Upload to GitHub Release

Once you have the DMG/ZIP:

1. Go to: https://github.com/Hukushiyu/claude_terminal/releases
2. Click "Edit" on the latest release (or create a new one)
3. Drag and drop:
   - `Claude.Cozy_0.6.8_x64.dmg`
   - `Claude.Cozy_0.6.8_x64.zip`
4. Click "Update release"

---

## ⏱️ Build Times

- **First build:** 10-15 minutes (compiling everything)
- **Subsequent builds:** 3-5 minutes (incremental compilation)
- **Clean build:** `cargo clean` then rebuild (15-20 minutes)

---

## 💡 Tips

**Speed up builds:**
```bash
# Use more CPU cores for Rust compilation
export CARGO_BUILD_JOBS=8  # Adjust to your CPU core count
```

**Clean build (if something's broken):**
```bash
# In project root
cargo clean
rm -rf node_modules
npm install
npm run tauri:build:mac:x64
```

**Build for your current architecture only:**
```bash
# If you're on Apple Silicon but want to test:
npm run tauri:build:mac:arm64

# If you're on Intel:
npm run tauri:build:mac:x64

# Universal binary (works on both, but 2x larger):
npm run tauri:build:mac:universal
```

---

**Questions?** Check the error output or open a GitHub issue with the build logs.
