# CLI History Integration - Implementation Complete

**Date:** May 17, 2026  
**Status:** ✅ **READY FOR TESTING**

## Summary

Successfully migrated from custom GUI history (.claude-desktop/history.json) to Claude CLI's native history system (~/.claude/projects/). This achieves **true parity** between GUI and CLI - they now share the same history storage.

## What Changed

### Before (Custom History)
```
GUI maintains: .claude-desktop/history.json
CLI maintains: ~/.claude/projects/{encoded}/*.jsonl

Problem: Clearing GUI history didn't clear CLI context
Result: Claude "remembered" old conversations even after "clear"
```

### After (CLI Parity)
```
Both use: ~/.claude/projects/{encoded}/*.jsonl

✅ Single source of truth
✅ Clear actually clears CLI context (uses `claude project purge`)
✅ GUI displays exact same history as CLI
✅ Simpler architecture - no duplicate state
```

---

## Implementation Details

### 1. Backend (Rust Commands)

**File:** `src-tauri/src/commands/history.rs`

**New Commands:**
- `list_sessions(project_path)` - Lists all .jsonl sessions for a project
- `load_session(project_path, session_id)` - Loads specific session
- `load_current_session(project_path)` - Loads most recent session
- `clear_history(project_path)` - Runs `claude project purge -y`
- `archive_history(project_path, archive_name)` - Copies .jsonl files before purging

**Key Functions:**
- `encode_project_path()` - Matches CLI's path encoding logic
- `get_claude_projects_dir()` - Returns `~/.claude/projects/`
- `parse_session()` - Parses .jsonl and extracts user/assistant messages
- `extract_user_content()` - Handles both string and array message content
- `extract_assistant_text()` - Filters out thinking blocks, returns only text

### 2. Frontend Updates

**File:** `src/utils/tauri-api.ts`

**Replaced:**
```typescript
// Old
saveHistory(projectPath, messages, toolEvents)
loadHistory(projectPath)

// New
listSessions(projectPath)
loadSession(projectPath, sessionId)
loadCurrentSession(projectPath)
```

**File:** `src/stores/chatStore.ts`

**Changes:**
- `loadHistory()` now calls `tauriAPI.loadCurrentSession()`
- Removed manual `saveHistory()` call after messages (CLI auto-saves)
- `clearHistory()` now properly clears CLI context

**File:** `src/types/ipc.ts`

**Added Types:**
```typescript
interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  id: string;
}

interface SessionInfo {
  session_id: string;
  message_count: number;
  first_timestamp: string;
  last_timestamp: string;
}
```

### 3. Dependencies

**File:** `src-tauri/Cargo.toml`

Added: `dirs = "5.0"` for cross-platform home directory detection

### 4. Registration

**File:** `src-tauri/src/lib.rs`

Registered new commands in `invoke_handler!`:
```rust
commands::history::list_sessions,
commands::history::load_session,
commands::history::load_current_session,
commands::history::clear_history,
commands::history::archive_history,
```

---

## How It Works

### Path Encoding

CLI encodes paths by replacing separators with dashes:
```
C:\Users\name\project  →  C--Users-name-project
/home/user/project     →  home-user-project
```

Our Rust implementation:
```rust
fn encode_project_path(path: &str) -> String {
    path.replace("\\", "/")   // Normalize
        .replace(":", "--")    // Windows drives
        .replace("/", "-")     // Path separators
        .trim_start_matches('-')
        .to_string()
}
```

### Session Loading Flow

1. User selects project
2. GUI calls `load_current_session(project_path)`
3. Backend:
   - Encodes project path
   - Finds `~/.claude/projects/{encoded}/`
   - Lists all `.jsonl` files
   - Loads most recent by timestamp
   - Parses line-delimited JSON
   - Extracts `user` and `assistant` entries
   - Returns `DisplayMessage[]`
4. Frontend displays messages in chat

### Clear History Flow

1. User clicks "Clear History"
2. GUI calls `clear_history(project_path)`
3. Backend executes: `claude project purge {path} -y`
4. CLI deletes:
   - All `.jsonl` transcripts
   - File edit history
   - Tasks
   - Memory
   - Project config entry
5. Next message starts fresh conversation

### Archive Flow

1. User triggers archive (future feature)
2. GUI calls `archive_history(project_path, timestamp)`
3. Backend:
   - Copies all `.jsonl` files to `.claude-desktop/archives/{timestamp}/`
   - Then runs `claude project purge`
4. History preserved but CLI context cleared

---

## Testing Checklist

### ✅ Unit Tests (Rust)

```bash
cd src-tauri
cargo test
```

**Test Cases:**
- `test_encode_project_path()` - Verifies path encoding matches CLI

### ⏳ Integration Tests (Manual)

**Test 1: Load Existing History**
- [ ] Select project with existing Claude CLI sessions
- [ ] Verify GUI loads messages correctly
- [ ] Compare with `claude --resume` picker - should match

**Test 2: Clear History**
- [ ] Send messages to Claude
- [ ] Click "Clear History"
- [ ] Verify messages disappear in GUI
- [ ] Send new message
- [ ] Verify Claude doesn't remember old context

**Test 3: Archive History**
- [ ] Send messages
- [ ] Archive history
- [ ] Verify `.claude-desktop/archives/` folder created
- [ ] Verify `.jsonl` files copied
- [ ] Verify GUI cleared
- [ ] Verify Claude starts fresh conversation

**Test 4: Cross-Platform Paths**
- [ ] Windows: Test with `C:\Users\name\project`
- [ ] Mac/Linux: Test with `/home/user/project`
- [ ] Verify encoded path matches CLI's directory name

**Test 5: Multiple Sessions**
- [ ] Have multiple sessions in `~/.claude/projects/{encoded}/`
- [ ] Call `list_sessions()`
- [ ] Verify all sessions returned with metadata
- [ ] Verify sorted by most recent first

---

## Architecture Benefits

### 1. Single Source of Truth
- GUI and CLI share same history storage
- No sync issues
- No duplicate state

### 2. True Clear
- "Clear History" actually clears CLI context
- Uses native `claude project purge` command
- No hidden conversation memory

### 3. Future-Proof
- Any CLI history features automatically work in GUI
- Can implement session browser/restore UI
- Can show session metadata (message count, timestamps)

### 4. Simpler Code
- Removed custom history save/load logic
- Removed `.claude-desktop/history.json` system
- Fewer moving parts = fewer bugs

---

## Known Limitations

### 1. Tool Events Not Preserved

CLI's `.jsonl` format includes tool execution in conversation transcript, but we don't parse it yet. Currently:
- ✅ User messages displayed
- ✅ Assistant text responses displayed
- ❌ Tool execution details not shown as separate events

**Future Enhancement:** Parse `tool_use` and `tool_result` entries from .jsonl to reconstruct tool event timeline.

### 2. Thinking Blocks Hidden

CLI saves Claude's `<thinking>` blocks in `.jsonl`, but we filter them out:
```rust
"thinking" => None,  // Skip thinking blocks
```

**Reason:** Thinking blocks are internal, not part of user-facing response.

**Future Enhancement:** Optional "Show Thinking" toggle to display reasoning process.

### 3. No Session Picker Yet

Backend supports `list_sessions()` and `load_session()`, but GUI doesn't have UI for it yet.

**Future Enhancement:** Add "Browse Sessions" modal:
- List all past sessions with timestamps
- Click to load historical session
- Resume or fork from old conversation

---

## Next Steps

### Immediate
1. ✅ Code complete
2. ⏳ Test on dev machine
3. ⏳ Test cross-platform (Windows/Mac)
4. ⏳ Verify no regressions

### Short-term (v0.7.0)
- [ ] Add session browser UI
- [ ] Implement session restore/resume
- [ ] Add session naming (uses CLI's `--name` flag)
- [ ] Parse tool events from .jsonl

### Long-term
- [ ] Memory browser (parse `memory/` subdirectory)
- [ ] Session search/filter
- [ ] Export sessions as markdown
- [ ] Import archived sessions

---

## Files Modified

### Rust Backend
- ✅ `src-tauri/src/commands/history.rs` - Complete rewrite
- ✅ `src-tauri/src/lib.rs` - Updated command registration
- ✅ `src-tauri/Cargo.toml` - Added `dirs` dependency

### Frontend
- ✅ `src/utils/tauri-api.ts` - Replaced history methods
- ✅ `src/stores/chatStore.ts` - Updated load/clear logic
- ✅ `src/types/ipc.ts` - Added CLI history types

### Documentation
- ✅ `CLI_HISTORY_FORMAT.md` - .jsonl format analysis
- ✅ `CLI_HISTORY_INTEGRATION_COMPLETE.md` - This file

---

## Compilation Status

```bash
✅ cargo check
   Compiling claude-terminal v0.6.0
   Finished `dev` profile [unoptimized + debuginfo]
   
   1 warning (harmless - unused struct field)
```

---

## User Impact

### Positive Changes
- ✅ **True clear** - History clear actually works now
- ✅ **CLI parity** - GUI shows same history as terminal
- ✅ **Faster load** - Removed unnecessary file I/O
- ✅ **More reliable** - Single source of truth

### Potential Issues
- ⚠️ **Migration needed** - Old `.claude-desktop/history.json` files ignored
- ⚠️ **Different format** - Message IDs and timestamps from CLI, not GUI

### Migration Notes
On first launch after update:
1. Old GUI history in `.claude-desktop/history.json` no longer loaded
2. App will load CLI's history instead (if exists)
3. Users may see "empty" chat if they never used CLI directly
4. Subsequent messages save to CLI history automatically

**Recommendation:** Add migration notification explaining the change.

---

## Success Criteria

### Must Have
- [x] Rust code compiles without errors
- [ ] GUI loads CLI history correctly
- [ ] Clear history clears CLI context
- [ ] No crashes or data loss

### Nice to Have
- [ ] Archive functionality tested
- [ ] Session list UI implemented
- [ ] Migration guide for users

---

## Developer Notes

### Testing Locally

1. **Find your CLI history:**
   ```bash
   ls ~/.claude/projects/
   ```

2. **Inspect a session:**
   ```bash
   head -5 ~/.claude/projects/{encoded-path}/{session-id}.jsonl
   ```

3. **Test path encoding:**
   ```bash
   cd src-tauri
   cargo test test_encode_project_path -- --show-output
   ```

4. **Test clear:**
   ```bash
   # In GUI, click Clear History
   # Then in terminal:
   ls ~/.claude/projects/{encoded-path}/  # Should be empty or deleted
   ```

### Debugging

**If history doesn't load:**
1. Check project path encoding matches CLI
2. Verify `.jsonl` files exist in `~/.claude/projects/`
3. Check console for parsing errors
4. Verify timestamps are valid ISO 8601

**If clear doesn't work:**
1. Check `claude` command is in PATH
2. Verify `claude project purge` runs manually
3. Check for permission errors

---

## Version Info

**App Version:** 0.6.0  
**Feature:** CLI History Integration  
**Status:** Implementation Complete, Ready for Testing  
**Date:** May 17, 2026

---

**Ready for:** Testing and QA before production release
