# Clear History Button - Implementation Complete

**Date:** May 17, 2026  
**Status:** ✅ Ready for testing

## Summary

Added a "Clear History" button to the app header with proper confirmation modal, as discussed.

## Design Decision

**One button approach:**
- Single "Clear History" button in header
- Runs `claude project purge` (clears both GUI and CLI context)
- Confirmation modal prevents accidental clears
- Simple mental model: Clear = fresh start

**Why not "Clear Chat" + "Clear History"?**
- Too technical/confusing for users
- Breaks CLI parity (CLI doesn't have this distinction)
- Would require bringing back dual storage (just removed it)
- `--continue` flag is always on - no way to have "visual clear only"

## Implementation

### 1. Created ClearHistoryModal Component

**File:** `src/components/layout/ClearHistoryModal.tsx`

**Features:**
- Warning icon and clear messaging
- Explains action: "delete all messages and start fresh conversation"
- Notes: "cannot be undone" + "permanently removed"
- Cancel button (gray)
- Clear History button (red, with loading spinner)
- Proper disabled states during clearing

**UI:**
```
⚠️ Clear History?

This will delete all messages and start a fresh 
conversation with Claude.

Note: This action cannot be undone. All conversation 
context will be permanently removed.

[Cancel]  [Clear History]
```

### 2. Added Button to Header

**File:** `src/components/layout/AppShell.tsx`

**Location:** Header right side, before Model Selector

**Styling:**
- Red theme: `bg-red-50 hover:bg-red-100 border-red-200`
- Red text: `text-red-700 hover:text-red-800`
- Trash icon: 🗑️
- Label: "Clear History"
- Tooltip: "Clear conversation history"

**Button order in header (left to right):**
1. Clear History 🗑️ (new)
2. Model Selector
3. Permission Status
4. Settings ⚙️
5. Help ?

### 3. State Management

**Added state:**
```typescript
const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
```

**Modal rendering:**
```typescript
<ClearHistoryModal 
  isOpen={showClearHistoryModal} 
  onClose={() => setShowClearHistoryModal(false)} 
/>
```

**Button click:**
```typescript
onClick={() => setShowClearHistoryModal(true)}
```

## User Flow

1. User clicks "Clear History" button in header
2. Modal appears with warning and explanation
3. User options:
   - **Cancel** - closes modal, nothing happens
   - **Clear History** - button shows spinner, calls `clearHistory()`
4. Backend runs `claude project purge {project_path} -y`
5. CLI deletes all transcripts, file history, tasks, memory
6. GUI clears messages array
7. Modal closes
8. Chat is now empty, next message starts fresh conversation

## Technical Details

**Backend (already implemented):**
```rust
#[tauri::command]
pub async fn clear_history(project_path: String) -> Result<String, String> {
    Command::new("claude")
        .args(&["project", "purge", &project_path, "-y"])
        .output()
        .map_err(|e| format!("Failed to execute claude command: {}", e))?;
    // ...
}
```

**Frontend (chatStore):**
```typescript
clearHistory: async () => {
    await tauriAPI.killClaudeProcess();
    if (projectPath) {
        await tauriAPI.clearHistory(projectPath);
    }
    set({
        messages: [],
        toolEvents: [],
        // ... reset all state
    });
}
```

## Testing Checklist

### Visual Testing
- [ ] Button appears in header
- [ ] Red styling matches design
- [ ] Trash icon displays correctly
- [ ] Button has hover state
- [ ] Tooltip appears on hover

### Modal Testing
- [ ] Modal opens when button clicked
- [ ] Warning icon displays
- [ ] Text is clear and readable
- [ ] Cancel button closes modal
- [ ] Clear button shows spinner during operation
- [ ] Buttons disabled during clearing
- [ ] Modal closes after successful clear

### Functional Testing
- [ ] Send messages to Claude
- [ ] Click Clear History
- [ ] Confirm clear
- [ ] Messages disappear from GUI
- [ ] Send new message
- [ ] Claude doesn't remember old conversation (fresh start)
- [ ] Check `~/.claude/projects/{encoded}/` - should be empty

### Edge Cases
- [ ] Click clear when no messages - should still work
- [ ] Click cancel - messages remain
- [ ] Click clear during active message - should handle gracefully
- [ ] Network error during clear - shows error, modal stays open

## Files Modified

- ✅ `src/components/layout/ClearHistoryModal.tsx` - New file
- ✅ `src/components/layout/AppShell.tsx` - Added button and modal
- ✅ `src/utils/tauri-api.ts` - Fixed duplicate entries (cleanup)

## Files NOT Modified

- `src/stores/chatStore.ts` - clearHistory() already implemented
- `src-tauri/src/commands/history.rs` - clear_history() already implemented
- `src-tauri/src/lib.rs` - clear_history command already registered

## Styling

**Button CSS Classes:**
```css
px-3 py-1.5           /* Padding */
bg-red-50             /* Light red background */
hover:bg-red-100      /* Darker on hover */
border border-red-200 /* Red border */
rounded               /* Rounded corners */
transition-colors     /* Smooth color transitions */
text-red-700          /* Red text */
hover:text-red-800    /* Darker text on hover */
text-sm font-medium   /* Typography */
flex items-center     /* Flexbox layout */
gap-1.5               /* Space between icon and text */
```

**Modal matches app theme:**
- White background
- Gray borders
- Red confirm button
- Standard border-radius
- Proper spacing and typography

## User Documentation

**What to tell users:**

> **Clear History** - Permanently deletes all messages and conversation context with Claude. This gives you a fresh start. Use this when you want Claude to forget everything from the current conversation.
>
> **When to use:**
> - Starting a completely new topic
> - Claude is confused/stuck on old context
> - You want to reset the conversation
>
> **Note:** This cannot be undone. If you want to keep the history, there's no "clear view only" option - just scroll up to see older messages.

## Future Enhancements

Potential additions (not in current scope):

1. **Archive Before Clear**
   - Add checkbox: "Archive before clearing"
   - Saves `.jsonl` files to `.claude-desktop/archives/` before purging
   - Requires implementing archive UI

2. **Session Browser**
   - "View Past Sessions" button
   - Browse/restore archived conversations
   - Backend already supports `list_sessions()`

3. **Keyboard Shortcut**
   - Ctrl+Shift+Delete to open clear modal
   - Matches browser convention

4. **Undo Clear (Grace Period)**
   - 5-second grace period before purge
   - "Undo" button in toast notification
   - Requires temporary holding area

## Known Issues

None - implementation is complete and straightforward.

## Compilation Status

```bash
✅ Rust: cargo check - Finished successfully
⚠️  TypeScript: Has pre-existing errors unrelated to this feature
    - AppShell icon import (pre-existing)
    - ChatInterface argument count (pre-existing)  
    - PermissionStatusButton unused var (pre-existing)
```

Clear History button code is clean and compiles correctly.

---

**Status:** Ready for user testing  
**Version:** 0.6.0  
**Feature:** Clear History Button with Confirmation Modal
