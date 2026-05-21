# Apple Notarization Setup for GitHub Actions

This guide explains how to set up Apple notarization for Claude Cozy Mac builds.

## What is Notarization?

**Notarization** is Apple's process of scanning your app for malicious content and security issues. Once notarized, your app won't trigger Gatekeeper warnings on user's Macs.

**Benefits:**
- ✅ No "Apple cannot verify..." warnings
- ✅ Users can double-click to install (no right-click workaround)
- ✅ Professional, trusted installation experience
- ✅ Required for distribution outside the Mac App Store

---

## Prerequisites

You need **4 GitHub Secrets** for notarization:

### 1. APPLE_CERTIFICATE
**What:** Your Developer ID Application certificate (`.p12` format, base64 encoded)

**How to get it:**
- Already set up in `GITHUB_SIGNING_SETUP.md`
- Used for code signing

### 2. APPLE_CERTIFICATE_PASSWORD
**What:** The password for your `.p12` certificate

**How to get it:**
- The password you set when exporting the certificate
- Already set up in `GITHUB_SIGNING_SETUP.md`

### 3. APPLE_API_KEY
**What:** App Store Connect API key (`.p8` file content)

**How to get it:**
1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Sign in with your Apple Developer account
3. Navigate to **Users and Access** → **Keys** tab
4. Click **+** to create a new key
5. **Name:** "GitHub Actions Notarization"
6. **Access:** Check **Developer** (not Admin)
7. Click **Generate**
8. **Download the `.p8` file** (you can only download it once!)
9. Open the `.p8` file in a text editor
10. Copy the entire contents (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)

### 4. APPLE_API_KEY_ID
**What:** The Key ID for your App Store Connect API key

**How to get it:**
- Shown on the App Store Connect Keys page after creating the key
- Format: 10 characters like `ABC123DEFG`
- Also shown in the downloaded `.p8` filename: `AuthKey_ABC123DEFG.p8`

### 5. APPLE_API_ISSUER
**What:** Your Team's Issuer ID

**How to get it:**
1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Navigate to **Users and Access** → **Keys** tab
3. Look at the top of the page for **Issuer ID**
4. Format: UUID like `12345678-1234-1234-1234-123456789012`

### 6. APPLE_SIGNING_IDENTITY
**What:** Your Developer ID identity name

**How to get it:**
- Already set up in `GITHUB_SIGNING_SETUP.md`
- Format: `Developer ID Application: Your Name (TEAM123456)`

---

## Adding Secrets to GitHub

1. Go to your repository: https://github.com/Hukushiyu/claude_terminal/settings/secrets/actions

2. Add each secret:
   - Click **New repository secret**
   - Enter the **Name** (exactly as shown above)
   - Paste the **Value**
   - Click **Add secret**

### Secret Checklist

- ✅ `APPLE_CERTIFICATE` (base64 encoded .p12)
- ✅ `APPLE_CERTIFICATE_PASSWORD` (string)
- ✅ `APPLE_API_KEY` (entire .p8 file contents)
- ✅ `APPLE_API_KEY_ID` (10-character string)
- ✅ `APPLE_API_ISSUER` (UUID)
- ✅ `APPLE_SIGNING_IDENTITY` (Developer ID string)

---

## How It Works

The GitHub Actions workflow (`.github/workflows/build.yml`) does this:

### For Each Mac Build (ARM + Intel):

1. **Import Code Signing Certificate**
   - Creates temporary keychain
   - Imports your Developer ID certificate
   - Unlocks keychain for codesign

2. **Build & Sign**
   - Compiles the Tauri app
   - Signs with your Developer ID (removes first Gatekeeper warning)

3. **Notarize** ⭐ NEW!
   - Zips the `.app` bundle
   - Submits to Apple's notarization service
   - Waits for Apple to scan and approve (usually 2-5 minutes)
   - Staples the notarization ticket to the app
   - Verifies everything worked

4. **Package**
   - Creates DMG installer (with notarized app inside)
   - Creates ZIP archive (with notarized app inside)

5. **Upload Artifacts**
   - Both DMG and ZIP are fully notarized and ready for distribution

---

## Testing Notarization

After the build completes, download the Mac artifact and test:

```bash
# Extract the app
unzip Claude.Cozy_0.6.8_aarch64.zip

# Check code signature
codesign -dv --verbose=4 "Claude Cozy.app"
# Should show: Authority=Developer ID Application: Your Name

# Check notarization
spctl -a -vv -t install "Claude Cozy.app"
# Should say: accepted
# Should say: Notarized Developer ID

# Check stapled ticket
stapler validate "Claude Cozy.app"
# Should say: The validate action worked!
```

---

## Troubleshooting

### "Invalid credentials" during notarization
- **Check:** `APPLE_API_KEY` is the full `.p8` file contents (including BEGIN/END lines)
- **Check:** `APPLE_API_KEY_ID` matches the key you created
- **Check:** `APPLE_API_ISSUER` is your team's UUID

### "Notarization failed" with error code
- **Check build logs** for the specific error message
- Common issues:
  - App not properly signed (needs Developer ID Application cert)
  - Missing entitlements
  - Code signature issues

### "Could not find credentials" 
- **Check:** All 3 notarization secrets exist: `APPLE_API_KEY`, `APPLE_API_KEY_ID`, `APPLE_API_ISSUER`
- **Check:** No extra spaces or newlines in secret values

### Notarization succeeds but app still shows warning
- **Check:** Did stapling succeed? Run `stapler validate "Claude Cozy.app"`
- **Try:** Re-download the app (macOS may have cached the old version)

---

## Cost

**Notarization is FREE** with your Apple Developer account ($99/year).

There's no per-notarization charge, and the API key can be used unlimited times.

---

## Security Notes

- ✅ Secrets are encrypted by GitHub
- ✅ API key is written to temp file and immediately deleted
- ✅ Pull requests cannot access secrets (for security)
- ✅ Notarization happens in isolated GitHub runners
- ⚠️ Never commit the `.p8` file to your repository
- ⚠️ Never share your API key publicly

---

## What Happens After Notarization?

**Users get a seamless experience:**

1. **Download** - User downloads `Claude.Cozy_0.6.8_aarch64.dmg`
2. **Open** - Double-click the DMG
3. **Install** - Drag to Applications folder
4. **Launch** - Double-click the app
5. **No warnings!** - App opens immediately ✨

No right-click workarounds. No "Open Anyway" in System Preferences. Just works!

---

## References

- [Apple Notarization Documentation](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [notarytool Manual](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution/customizing_the_notarization_workflow)
- [App Store Connect API Keys](https://developer.apple.com/documentation/appstoreconnectapi/creating_api_keys_for_app_store_connect_api)

---

**Questions?** Check the GitHub Actions logs or create an issue.
