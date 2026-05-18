# Revert Instructions: dirs Dependency Removal

**Date:** May 17, 2026  
**Change:** Removed `dirs` crate dependency to enable cross-compilation

## If You Need to Revert

If the new implementation causes issues, follow these steps:

### 1. Restore history.rs

**File:** `src-tauri/src/commands/history.rs`

**Find this function (line ~58-67):**
```rust
/// Gets the Claude CLI projects directory (~/.claude/projects)
fn get_claude_projects_dir() -> Result<PathBuf, String> {
    let home = if cfg!(windows) {
        std::env::var("USERPROFILE")
    } else {
        std::env::var("HOME")
    }.map_err(|_| "Cannot find home directory".to_string())?;
    
    Ok(PathBuf::from(home).join(".claude").join("projects"))
}
```

**Replace with original:**
```rust
/// Gets the Claude CLI projects directory (~/.claude/projects)
fn get_claude_projects_dir() -> Result<PathBuf, String> {
    dirs::home_dir()
        .ok_or("Cannot find home directory".to_string())
        .map(|home| home.join(".claude").join("projects"))
}
```

### 2. Restore Cargo.toml Dependency

**File:** `src-tauri/Cargo.toml`

**Add back to dependencies section (around line 33):**
```toml
dirs = "5.0"
```

### 3. Rebuild

```bash
cd src-tauri
cargo clean
cargo check
cd ..
npm run tauri:build
```

---

## What Changed

### Before (with dirs crate)
- Used `dirs::home_dir()` function
- External dependency on `dirs` crate v5.0
- Prevented cross-compilation between architectures
- Worked reliably on all platforms

### After (without dirs crate)
- Uses `std::env::var()` to read environment variables
- No external dependencies for home directory detection
- Should enable cross-compilation (untested)
- Relies on standard environment variables:
  - Windows: `USERPROFILE`
  - Mac/Linux: `HOME`

---

## Testing After Revert

If you revert, test these functions:
1. Load history on project selection
2. Clear history button
3. List sessions (if implemented in UI)

All should work exactly as before.

---

## Why We Removed It

The `dirs` crate was blocking cross-compilation from Intel Mac to ARM Mac. It was only used in one place (getting home directory), so we replaced it with standard library functions that should work everywhere.

---

## Alternative Solutions (If This Fails)

If environment variable approach doesn't work and you can't revert:

**Option 1: Tauri's Path API**
```rust
// Requires importing tauri::api::path
fn get_claude_projects_dir() -> Result<PathBuf, String> {
    tauri::api::path::home_dir()
        .ok_or("Cannot find home directory".to_string())
        .map(|home| home.join(".claude").join("projects"))
}
```

**Option 2: Platform-specific implementations**
```rust
fn get_claude_projects_dir() -> Result<PathBuf, String> {
    #[cfg(target_os = "windows")]
    let home = std::env::var("USERPROFILE")
        .map_err(|_| "Cannot find USERPROFILE".to_string())?;
    
    #[cfg(not(target_os = "windows"))]
    let home = std::env::var("HOME")
        .map_err(|_| "Cannot find HOME".to_string())?;
    
    Ok(PathBuf::from(home).join(".claude").join("projects"))
}
```

**Option 3: Use GitHub Actions (keep dirs)**
- Build on GitHub's ARM runners
- Keep `dirs` dependency
- See BUILD_INSTRUCTIONS_v0.6.0.md for workflow

---

**Questions?** Check if environment variables are set:
```bash
# Windows
echo %USERPROFILE%

# Mac/Linux
echo $HOME
```

Both should print your home directory path.
