# Claude Cozy

An attractive, lightweight and fun desktop GUI wrapper for the Claude CLI. Built with Tauri for blazing-fast performance and tiny bundle sizes.

![Version](https://img.shields.io/badge/version-0.9.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-lightgrey)

---

## 💡 Why Choose Claude Cozy?

**Claude Cozy is perfect for users who want Claude's full power without the complexity.**

While Anthropic's official Claude Code Desktop is packed with advanced features for power users (multi-session management, MCP servers, computer use, SSH sessions, etc.), **Claude Cozy focuses on what most people actually need**: a clean, fast way to chat with Claude and work with their files.

### 🎯 Who Is This For?

- **Beginners** who find the official app overwhelming with too many options
- **Casual users** who just want to chat with Claude and edit files
- **Anyone** who prefers a simple, focused workspace over complex IDE features
- **Users** who value speed and lightweight apps (90% smaller!)
- **Those** who want beautiful custom themes and a personalized experience

### ⚖️ Claude Cozy vs. Claude Code Desktop

| What You Get | Claude Cozy | Claude Code Desktop |
|--------------|-----------------|---------------------|
| **Chat with Claude** | ✅ | ✅ |
| **Read/Write/Edit Files** | ✅ Full access | ✅ Full access |
| **In-App File Editor** | ✅ CodeMirror + syntax highlighting | ✅ With file editor |
| **PDF & Image Preview** | ✅ Native rendering | ⚠️ Limited |
| **Beautiful Themes** | ✅ 6 built-in + custom themes | ⚠️ Limited |
| **Multi-Tab Sessions** | ✅ Up to 6 tabs | ✅ Unlimited |
| **Plugin & Skill Discovery** | ✅ Autocomplete with previews | ✅ |
| **App Size** | ✅ **10-15MB** | ❌ 120-150MB |
| **Memory Usage** | ✅ **Low** | ❌ Higher |
| **Learning Curve** | ✅ **Minutes** | ⚠️ Steeper |
| **Open Source** | ✅ **MIT License** | ❌ Proprietary |
| | | |
| **Advanced Features** | | |
| Built-in Terminal | ❌ | ✅ |
| Computer Use (Screen Control) | ❌ | ✅ |
| MCP Servers & Plugins | ❌ | ✅ |
| Remote/SSH Sessions | ❌ | ✅ |
| PR Monitoring & Auto-fix | ❌ | ✅ |

### 🚀 The Bottom Line

**Both apps can do the essential work** - read files, write code, edit your projects. The difference is in complexity and size.

- **Choose Claude Cozy** if you want a lightweight, beautiful app that does the core tasks exceptionally well
- **Choose Claude Code Desktop** if you need advanced features like multi-session management, remote execution, or computer control

**Think of it like this:** Claude Code Desktop is a professional IDE suite. Claude Cozy is a focused, elegant text editor. Both are powerful — it just depends on what you need.

---

## ✨ Features

### 🎨 Beautiful Interface
- **6 Built-in Color Themes** + create unlimited custom themes
- **Streaming Responses** - Watch Claude think and respond in real-time
- **Thinking Indicators** - See Claude's reasoning process with animated status updates
- **Clean Design** - Distraction-free workspace for productive conversations

### 📑 Multi-Tab Sessions
- **Up to 6 Concurrent Tabs** - Work on multiple projects simultaneously
- **Per-Tab State Isolation** - Each tab has independent chat history, file tree, permissions, and model
- **Tab Management** - Create (Ctrl+T), close (Ctrl+W), switch (Ctrl+Tab), right-click for context menu
- **Tab Persistence** - Tabs restore across app restarts

### 📁 Smart File Management
- **File Tree Explorer** - VS Code-style tree with lazy loading (per-tab)
- **Single-Click Preview** - Read-only syntax-highlighted preview in sidebar panel
- **Double-Click to Edit** - Opens full CodeMirror editor in the content area
- **Inner File Tabs** - Up to 5 open file editor tabs per project tab, alongside Chat
- **PDF Preview** - Native WebView PDF rendering (single-click from file tree)
- **Image Preview** - PNG, JPG, GIF, SVG, WebP and more
- **Unsaved Changes Protection** - Dirty indicator (●), Save All prompt on app close
- **@ File References** - Type `@` in chat or hover files to insert references
- **Git Integration** - Respects .gitignore patterns

### 🔌 Plugin & Skill Autocomplete
- **Plugin-Aware Dropdown** - Type `/` to see all commands grouped by plugin with `[PLUGIN]` badge
- **Skill Sub-Rows** - Plugin skills shown indented under their parent plugin, always expanded
- **Built-in Command Descriptions** - `/usage`, `/clear`, `/compact` and more shown with descriptions
- **Tab Navigation** - Tab key moves through plugin headers and skill sub-rows
- **File Autocomplete** - Type `@` to fuzzy-search project files

### 🛠️ Full Claude CLI Power
- **Tool Execution** - Read, Write, Edit files and run Bash commands with visual tool cards
- **Permission System** - Per-tab permission modes (Ask / Accept Edits / Auto-Approve / Plan / etc.)
- **Session Management** - Browse, load, and manage conversation sessions per tab
- **Model Selector** - Per-tab model selection (Sonnet 4.6, Opus 4.7, Haiku 4.5)

### ⚡ Performance
- **10-15MB Bundle** - ~90% smaller than Electron alternatives
- **Native Performance** - Built with Rust + Tauri
- **Low Memory** - Uses system WebView instead of bundled Chromium
- **Auto-Updates** - Seamless updates via GitHub Releases

---

## 🚀 Quick Start

### Prerequisites

1. **Claude CLI** - Must be installed and authenticated
   ```bash
   # Install Claude CLI (if not already installed)
   npm install -g @anthropic-ai/claude-cli

   # Login to your Claude account
   claude auth login
   ```

2. **System Requirements**
   - Windows 10/11 or macOS 10.13+
   - 100MB free disk space
   - Active internet connection

### Installation

#### Windows
1. Download `Claude.Cozy_0.9.0_x64-setup.exe` from [Releases](https://github.com/Hukushiyu/claude_cozy/releases)
2. Run the installer
3. Launch "Claude Cozy" from Start Menu

#### macOS (Apple Silicon - M1/M2/M3/M4)
1. Download `Claude.Cozy_0.9.0_aarch64.dmg` from [Releases](https://github.com/Hukushiyu/claude_cozy/releases)
2. Open the DMG and drag Claude Cozy to Applications
3. Launch from Applications - **No Gatekeeper warning!** ✨ (Signed with Developer ID)

#### macOS (Intel)
1. Download `Claude.Cozy_0.9.0_x64.dmg` from [Releases](https://github.com/Hukushiyu/claude_cozy/releases)
2. Open the DMG and drag Claude Cozy to Applications
3. Launch from Applications - **No Gatekeeper warning!** ✨ (Signed with Developer ID)

---

## 📖 Usage

### Getting Started

1. **Select Project**
   - Click "Select Project Folder" or Ctrl+O
   - Choose your project directory

2. **Chat with Claude**
   - Type your message in the input area
   - Press Enter or click Send
   - Watch Claude's streaming response

3. **Reference Files**
   - Type `@` in chat to fuzzy-search and insert file references
   - Or hover over files in the tree and click the @ button

4. **Edit Files**
   - Single-click a file → read-only preview in sidebar panel
   - Double-click a file → opens full CodeMirror editor in content area
   - Up to 5 file editor tabs open per project tab
   - Ctrl+S to save, unsaved changes shown with ● indicator

5. **Approve Tool Use**
   - When Claude needs to read/write files, a permission prompt appears
   - Review the operation and click "Approve"
   - Subsequent operations execute without prompting (session-based)

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+T` | Create new tab |
| `Ctrl+W` | Close current tab |
| `Ctrl+Tab` | Switch to next tab |
| `Ctrl+Shift+Tab` | Switch to previous tab |
| `Ctrl+S` | Save current file (in editor) |
| `Ctrl+/` | Toggle help modal |
| `Enter` | Send message |
| `Shift+Enter` | New line in message |

*Use `Cmd` instead of `Ctrl` on macOS*

### Slash Commands

Type `/` in chat to browse all available commands with descriptions:

- `/reset-permissions` - Reset tool execution permissions
- `/help` - Show commands and shortcuts
- `/usage` - Show token usage for current session
- `/clear` - Clear the screen
- `/compact` - Compact conversation context
- Plus all your installed Claude CLI skills and plugins

---

## 🏗️ Built With

- **[Tauri 2.x](https://tauri.app/)** - Desktop app framework
- **[Rust](https://www.rust-lang.org/)** - Backend runtime
- **[React 18](https://react.dev/)** - UI framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[Zustand](https://github.com/pmndrs/zustand)** - State management
- **[CodeMirror 6](https://codemirror.net/)** - In-app file editor
- **[Claude CLI](https://github.com/anthropics/claude-cli)** - AI integration

---

## 🛠️ Development

### Setup

1. **Install Rust**
   ```bash
   # Windows: Download from https://www.rust-lang.org/tools/install
   # macOS/Linux:
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Clone Repository**
   ```bash
   git clone https://github.com/Hukushiyu/claude_cozy.git
   cd claude_cozy
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Run Development Server**
   ```bash
   npm run tauri:dev
   ```

### Building

```bash
# Build for current platform
npm run tauri:build

# Windows-specific
npm run tauri:build:win

# macOS-specific
npm run tauri:build:mac:universal  # Universal binary (Intel + Apple Silicon)
npm run tauri:build:mac:arm64      # Apple Silicon only
npm run tauri:build:mac:x64        # Intel only
```

Build outputs: `src-tauri/target/release/bundle/`

---

## 📚 Documentation

- **[CHANGELOG.md](CHANGELOG.md)** - Version history and release notes

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Report Bugs** - Open an issue with reproduction steps
2. **Suggest Features** - Share your ideas in GitHub Issues
3. **Submit PRs** - Fork, create a feature branch, and submit a pull request

### Development Guidelines

- Run `cargo fmt` before committing Rust code
- Run `cargo clippy` to check for Rust linting issues
- Test builds on your platform before submitting PRs
- Update CHANGELOG.md for user-facing changes

---

## 🐛 Known Issues

- **HTML5 Drag & Drop** - File drag-drop into chat disabled (Tauri limitation), use @ button or type `@filename` instead

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- **[Anthropic](https://www.anthropic.com/)** - For Claude and the Claude CLI
- **[Tauri Team](https://tauri.app/)** - For the amazing desktop framework
- **Open Source Community** - For the incredible tools and libraries

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Hukushiyu/claude_cozy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Hukushiyu/claude_cozy/discussions)

---

<div align="center">
  <sub>Built with ❤️ by the Claude Cozy team</sub>
</div>
