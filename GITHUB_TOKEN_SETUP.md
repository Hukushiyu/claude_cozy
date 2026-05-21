# GitHub Token Setup for Auto-Update

## Why This Matters

The auto-updater checks GitHub's API for new releases. Without authentication:
- **Rate Limit:** 60 requests/hour per IP address
- **With Token:** 5,000 requests/hour

Our app now caches checks (every 6 hours), so the token is **optional** for most users. Only add it if you're testing frequently or have many users on the same network.

---

## Setup Instructions

### 1. Create a New GitHub Token

**Go to:** https://github.com/settings/tokens

1. Click **"Generate new token"** → **"Classic"**
2. **Name:** `Claude Cozy Update Checker`
3. **Scopes:** Only check `public_repo` (read access to public repos)
4. **Expiration:** Choose what works for you (e.g., 90 days)
5. Click **"Generate token"**
6. **Copy the token** (you'll only see it once!)

### 2. Add Token to Your Local Environment

**Create `.env.local` file** (it's already in `.gitignore`):

```bash
# In the project root:
echo "VITE_GITHUB_TOKEN=ghp_yourActualTokenHere" > .env.local
```

**Or manually create `.env.local`:**

```env
# GitHub Personal Access Token for update checks
# DO NOT COMMIT THIS FILE
VITE_GITHUB_TOKEN=ghp_yourActualTokenHere
```

### 3. Verify It Works

```bash
npm run dev
```

Check the console - you should see:
```
[Updater] Using authenticated GitHub API (higher rate limits)
```

---

## For Production Builds (GitHub Actions)

If you build via GitHub Actions, add the token as a **repository secret**:

1. Go to your repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. **Name:** `GITHUB_TOKEN` (this is automatically provided by GitHub Actions)
4. **Value:** Leave it - GitHub provides this automatically with repo permissions

Then in your workflow file (`.github/workflows/build.yml`):

```yaml
- name: Build app
  env:
    VITE_GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: npm run tauri build
```

---

## Security Notes

### ✅ DO:
- Use environment variables (`.env.local`)
- Keep `.env.local` in `.gitignore`
- Use minimal token scopes (`public_repo` only)
- Rotate tokens every 90 days

### ❌ DON'T:
- **Never** hardcode tokens in source files
- **Never** commit `.env.local` to git
- **Never** share tokens publicly (Slack, Discord, GitHub issues, etc.)
- **Never** use tokens with write permissions for read-only tasks

### If You Accidentally Expose a Token:
1. **Revoke it immediately:** https://github.com/settings/tokens
2. Generate a new one
3. If it was committed, consider it compromised forever (git history persists)

---

## Do I Really Need This?

**No!** The updater now works fine without a token:
- ✅ Checks only every 6 hours (not every launch)
- ✅ Handles rate limits gracefully (silently fails)
- ✅ Doesn't block the app or annoy users

**Only add a token if:**
- You're developing/testing and launching the app many times per hour
- You have hundreds of users behind the same corporate NAT (shared IP)
- You want guaranteed update checks even during heavy GitHub API usage
