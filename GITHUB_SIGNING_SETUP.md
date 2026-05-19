# GitHub Actions Mac Code Signing Setup

This guide walks you through setting up automated Mac code signing in GitHub Actions.

## 📋 Prerequisites

- ✅ Apple Developer account with a valid certificate
- ✅ Certificate exported as `.p12` file from Keychain Access (Mac) or Windows Certificate Store
- ✅ Certificate password (the one you set when exporting)
- ✅ Signing identity name (e.g., `Developer ID Application: Your Name (TEAM_ID)`)

---

## Step 1: Convert Certificate to Base64

**On Windows (PowerShell):**

```powershell
cd "C:\Users\joshua.gates\Dev Projects\Claude Terminal Project\claude-desktop-app\Tauri Builds"

# Run the conversion script
.\scripts\encode-cert.ps1 -CertPath "C:\path\to\your\certificate.p12"
```

This creates `certificate-base64.txt` with your encoded certificate.

**Alternative (Manual method):**

```powershell
# Read certificate and convert to base64
$certBytes = [System.IO.File]::ReadAllBytes("C:\path\to\certificate.p12")
$base64 = [System.Convert]::ToBase64String($certBytes)
$base64 | Out-File -FilePath "certificate-base64.txt" -Encoding ASCII -NoNewline
```

---

## Step 2: Find Your Signing Identity Name

Your signing identity should look like one of these:

- `Developer ID Application: Your Name (TEAM123456)`
- `Apple Development: your.email@example.com (TEAM123456)`
- `3rd Party Mac Developer Application: Your Name (TEAM123456)`

**To find it on Mac:**
```bash
security find-identity -v -p codesigning
```

**To find it on Windows:**
1. Open Certificate Manager (certmgr.msc)
2. Navigate to Personal → Certificates
3. Look at the certificate subject name
4. It should contain your name and Team ID

---

## Step 3: Add Secrets to GitHub

1. **Go to your repository settings:**
   ```
   https://github.com/Hukushiyu/claude_terminal/settings/secrets/actions
   ```

2. **Click "New repository secret"**

3. **Add these three secrets:**

   ### Secret 1: APPLE_CERTIFICATE
   - **Name:** `APPLE_CERTIFICATE`
   - **Value:** Open `certificate-base64.txt` and copy the entire contents (it will be very long, that's normal)
   - Click "Add secret"

   ### Secret 2: APPLE_CERTIFICATE_PASSWORD
   - **Name:** `APPLE_CERTIFICATE_PASSWORD`
   - **Value:** The password you used when exporting the .p12 certificate
   - Click "Add secret"

   ### Secret 3: APPLE_SIGNING_IDENTITY
   - **Name:** `APPLE_SIGNING_IDENTITY`
   - **Value:** Your full signing identity name (e.g., `Developer ID Application: John Smith (ABC1234567)`)
   - Click "Add secret"

---

## Step 4: Test the Build

### Option A: Automatic (Push to GitHub)

```bash
cd "C:\Users\joshua.gates\Dev Projects\Claude Terminal Project\claude-desktop-app\Tauri Builds"

# Commit the updated workflow
git add .github/workflows/build.yml src-tauri/tauri.conf.json scripts/encode-cert.ps1 GITHUB_SIGNING_SETUP.md
git commit -m "Add Mac code signing to GitHub Actions"
git push origin master

# The build will start automatically!
```

### Option B: Manual Trigger

1. Go to: `https://github.com/Hukushiyu/claude_terminal/actions`
2. Click "Build Claude Terminal" workflow
3. Click "Run workflow" → "Run workflow"
4. Watch the build progress

---

## Step 5: Verify Signing Worked

After the build completes:

1. **Download the Mac artifact** from the Actions run
2. **On a Mac, verify the signature:**
   ```bash
   # Extract the app
   unzip claude-terminal-mac-arm.zip
   
   # Check signature
   codesign -dv --verbose=4 "Claude Terminal.app"
   
   # Verify it's valid
   codesign --verify --deep --strict --verbose=2 "Claude Terminal.app"
   
   # Check Gatekeeper acceptance
   spctl -a -t exec -vv "Claude Terminal.app"
   ```

3. **Expected output:**
   - Should show your Developer ID
   - No errors in verification
   - Gatekeeper should accept it (if using Developer ID Application cert)

---

## 🎉 Success!

Your Mac builds will now be automatically code-signed on every push to master!

**What happens now:**
- Windows builds: Unsigned (users may see SmartScreen warning)
- Mac builds: Signed with your Developer ID (no Gatekeeper warning!)
- Pull requests: Build without signing (for testing)

---

## Troubleshooting

### "Certificate not found in keychain"
- Check that `APPLE_CERTIFICATE` is the full base64 string with no line breaks
- Verify `APPLE_CERTIFICATE_PASSWORD` is correct

### "User interaction is not allowed"
- This is normal in CI - the workflow handles it with `security set-key-partition-list`

### "No identity found"
- Check that `APPLE_SIGNING_IDENTITY` exactly matches what's in your certificate
- Run `security find-identity -v -p codesigning` on the Mac to verify the name

### Build succeeds but app still shows Gatekeeper warning
- You may need a "Developer ID Application" certificate (not "Apple Development")
- "Apple Development" certs are for testing, not distribution
- You may also need to notarize the app (separate process)

---

## Next Steps: Notarization (Optional)

For full Gatekeeper approval, you'll also need to **notarize** the app with Apple. This is a separate step that requires:

1. App-specific password for your Apple ID
2. Adding notarization to the GitHub workflow
3. Stapling the notarization ticket to the app

Let me know if you want to set that up too!

---

## Security Notes

- ✅ Secrets are encrypted by GitHub and never exposed in logs
- ✅ The temporary keychain is deleted after each build
- ✅ Pull requests cannot access secrets (for security)
- ⚠️ Delete `certificate-base64.txt` after uploading to GitHub (don't commit it!)

---

**Questions?** Check the workflow logs in GitHub Actions or create an issue.
