# Claude CLI History Format Analysis

## Discovery Date
May 17, 2026

## Location
Claude CLI stores conversation transcripts in:
```
~/.claude/projects/{encoded-project-path}/{session-uuid}.jsonl
```

## Path Encoding
Project paths are encoded by replacing path separators with `--`:
- `C:/Users/name/project` → `C--Users-name-project`
- `/home/user/project` → `home-user-project`

Example:
```
C:\Users\joshua.gates\Dev Projects\Claude Terminal Project\claude-desktop-app
→
C--Users-joshua-gates-Dev-Projects-Claude-Terminal-Project-claude-desktop-app
```

## File Format
- **Format:** Line-delimited JSON (`.jsonl`)
- **Structure:** One JSON object per line
- **Encoding:** UTF-8

## Message Types

### 1. User Messages (`type: "user"`)
```json
{
  "parentUuid": null,
  "isSidechain": false,
  "promptId": "...",
  "type": "user",
  "message": {
    "role": "user",
    "content": "User's message text"
  },
  "uuid": "...",
  "timestamp": "2026-05-15T15:15:23.677Z",
  "permissionMode": "default",
  "userType": "external",
  "entrypoint": "cli",
  "cwd": "...",
  "sessionId": "...",
  "version": "2.1.142",
  "gitBranch": "master"
}
```

**Key Fields:**
- `message.content`: The actual user message text
- `timestamp`: ISO 8601 timestamp
- `uuid`: Unique message ID
- `parentUuid`: Links to previous message (conversation threading)

### 2. Assistant Messages (`type: "assistant"`)
```json
{
  "parentUuid": "...",
  "isSidechain": false,
  "message": {
    "model": "claude-sonnet-4-5-20250929",
    "id": "msg_bdrk_...",
    "type": "message",
    "role": "assistant",
    "content": [
      {
        "type": "thinking",
        "thinking": "...",
        "signature": "..."
      },
      {
        "type": "text",
        "text": "Assistant's response text"
      }
    ],
    "stop_reason": "end_turn",
    "usage": { ... }
  },
  "type": "assistant",
  "uuid": "...",
  "timestamp": "2026-05-15T15:15:30.051Z"
}
```

**Key Fields:**
- `message.content`: Array of content blocks (thinking, text, tool_use)
- `message.model`: Which Claude model was used
- `timestamp`: ISO 8601 timestamp

**Content Block Types:**
- `type: "thinking"` - Claude's thinking process
- `type: "text"` - The actual assistant response
- `type: "tool_use"` - Tool execution request

### 3. Tool Result Messages (`type: "user"` with `tool_result`)
```json
{
  "type": "user",
  "message": {
    "role": "user",
    "content": [
      {
        "tool_use_id": "toolu_bdrk_...",
        "type": "tool_result",
        "content": "Tool output..."
      }
    ]
  },
  "toolUseResult": {
    "stdout": "...",
    "stderr": "...",
    "interrupted": false
  }
}
```

### 4. Metadata Events
- `type: "permission-mode"` - Permission settings
- `type: "file-history-snapshot"` - File edit tracking
- `type: "attachment"` - Deferred tools, skills listing

## Session Structure

Each `.jsonl` file contains:
1. Initial permission mode setting
2. User message (prompt)
3. Attachment events (tools, skills)
4. Assistant response
5. Tool use/result pairs (if any)
6. Subsequent turns...

## Directory Structure
```
~/.claude/projects/
├── {project-encoded-path-1}/
│   ├── {session-uuid-1}.jsonl
│   ├── {session-uuid-2}.jsonl
│   ├── {session-uuid-3}/     # Optional memory subdirectory
│   └── memory/                # Project memory files
├── {project-encoded-path-2}/
│   └── ...
```

## Additional Files
- `~/.claude/history.jsonl` - Global prompt history (not per-project)
- `~/.claude/file-history/{session-uuid}/` - File edit backups
- `~/.claude/tasks/{session-uuid}/` - Task tracking

## CLI Commands

### View History
```bash
claude --resume [search-term]  # Interactive session picker
```

### Clear History
```bash
claude project purge [path]    # Delete all project data
claude project purge --dry-run # Preview what would be deleted
```

### Continue Conversation
```bash
claude --continue              # Resume most recent in current directory
```

### Fork Session
```bash
claude --fork-session --continue  # New session ID, fresh context
```

## Implementation Notes

### For GUI Integration

**To display history:**
1. Encode project path
2. Scan `~/.claude/projects/{encoded}/` for `.jsonl` files
3. Parse each file line-by-line
4. Extract messages where `type === "user"` or `type === "assistant"`
5. For user messages: display `message.content`
6. For assistant messages: extract `text` blocks from `message.content[]`

**To clear history:**
1. Run `claude project purge {project-path} -y`
2. This deletes:
   - All `.jsonl` transcripts
   - File edit history
   - Tasks
   - Memory
   - Project config entry

**To archive history:**
1. Copy `.jsonl` files to archive location (with timestamp)
2. Then run purge command

**To list sessions:**
1. Read directory `~/.claude/projects/{encoded}/`
2. Filter for `*.jsonl` files (not subdirectories)
3. Parse first and last line for timestamp
4. Count lines where `type === "user"` or `type === "assistant"`

## Rust Implementation Strategy

### Structs Needed
```rust
#[derive(Deserialize)]
struct TranscriptLine {
    r#type: String,
    message: Option<Message>,
    timestamp: String,
    uuid: String,
    // ... other fields
}

#[derive(Deserialize)]
struct Message {
    role: String,
    content: serde_json::Value,  // Can be string or array
}

#[derive(Serialize)]
struct DisplayMessage {
    role: String,  // "user" or "assistant"
    content: String,
    timestamp: String,
    id: String,
}
```

### Parsing Logic
```rust
fn parse_session(file_path: &Path) -> Result<Vec<DisplayMessage>, String> {
    let file = BufReader::new(File::open(file_path)?);
    let mut messages = Vec::new();
    
    for line in file.lines() {
        let line = line?;
        let entry: TranscriptLine = serde_json::from_str(&line)?;
        
        match entry.r#type.as_str() {
            "user" => {
                if let Some(msg) = entry.message {
                    // Extract user message text
                    let content = extract_user_content(&msg.content);
                    messages.push(DisplayMessage { ... });
                }
            },
            "assistant" => {
                if let Some(msg) = entry.message {
                    // Extract assistant text blocks
                    let content = extract_assistant_text(&msg.content);
                    messages.push(DisplayMessage { ... });
                }
            },
            _ => continue,  // Skip metadata events
        }
    }
    
    Ok(messages)
}
```

### Path Encoding
```rust
fn encode_project_path(path: &str) -> String {
    path.replace("\\", "--")
        .replace("/", "-")
        .replace(":", "--")
        .trim_start_matches('-')
        .to_string()
}
```

### Home Directory
```rust
use dirs::home_dir;

fn get_claude_projects_dir() -> PathBuf {
    home_dir()
        .expect("Cannot find home directory")
        .join(".claude")
        .join("projects")
}
```

## Testing
- Test with existing session: `7c212615-de83-4961-bb74-53f97faca739.jsonl`
- Verify message extraction
- Confirm path encoding matches CLI's encoding
- Test purge command execution

## Benefits of CLI Parity
1. **Single source of truth** - No duplicate history
2. **True clear** - Purge actually clears CLI context
3. **Session management** - Can view/resume any past session
4. **Future-proof** - Any CLI history features automatically available
5. **Simpler** - Remove custom history system

---

**Status:** Analysis Complete  
**Next:** Implement Rust commands for history management
