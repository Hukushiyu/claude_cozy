# Claude Cozy

A beautiful, lightweight desktop GUI wrapper for the Claude CLI. Built with Tauri for blazing-fast performance and tiny bundle sizes.

![Version](https://img.shields.io/badge/version-0.6.16-blue)
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
| **File Tree & Preview** | ✅ Simple & clean | ✅ With file editor |
| **Beautiful Themes** | ✅ 6 custom themes | ⚠️ Limited |
| **App Size** | ✅ **10-15MB** | ❌ 120-150MB |
| **Memory Usage** | ✅ **Low** | ❌ Higher |
| **Learning Curve** | ✅ **Minutes** | ⚠️ Steeper |
| **Interface** | ✅ **Simple & focused** | ⚠️ Complex |
| **Open Source** | ✅ **MIT License** | ❌ Proprietary |
| | | |
| **Advanced Features** | | |
| Multiple Parallel Sessions | ❌ | ✅ |
| Built-in Terminal | ❌ | ✅ |
| Computer Use (Screen Control) | ❌ | ✅ |
| MCP Servers & Plugins | ❌ | ✅ |
| Remote/SSH Sessions | ❌ | ✅ |
| PR Monitoring & Auto-fix | ❌ | ✅ |

### 🚀 The Bottom Line

**Both apps can do the essential work** - read files, write code, edit your projects. The difference is in complexity and size.

- **Choose Claude Cozy** if you want a lightweight, beautiful app that does the core tasks exceptionally well
- **Choose Claude Code Desktop** if you need advanced features like multi-session management, remote execution, or computer control

**Think of it like this:** Claude Code Desktop is a professional IDE suite. Claude Cozy is a focused, elegant text editor. Both are powerful - it just depends on what you need.

---

## ✨ Features

### 🎨 Beautiful Interface
- **6 Color Themes** - Claude Classic, Light, Dark, Forest, Ocean, Sunset
- **Streaming Responses** - Watch Claude think and respond in real-time
- **Thinking Indicators** - See Claude's reasoning process with animated status updates
- **Clean Design** - Distraction-free workspace for productive conversations

### 📁 Smart File Management
- **File Tree Explorer** - VS Code-style tree with lazy loading
- **File Preview** - Syntax highlighting for 20+ languages, image preview support
- **@ File References** - Easily reference files in your conversations
- **Git Integration** - Respects .gitignore patterns

### 🛠️ Full Claude CLI Power
- **Tool Execution** - Read, Write, Edit files and run Bash commands
- **Permission System** - Transparent approval flow for file operations
- **Conversation History** - Auto-save with archive functionality
- **Model Selector** - Choose between Sonnet 4.6, Opus 4.7, or Haiku 4.5

### ⚡ Performance
- **10-15MB Bundle** - ~90% smaller than Electron alternatives
- **Native Performance** - Built with Rust + Tauri
- **Low Memory** - Uses system WebView instead of bundled Chromium
- **Auto-Updates** - Check for new releases from Settings

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
1. Download `Claude.Cozy_0.6.8_x64-setup.exe` from [Releases](https://github.com/Hukushiyu/claude_terminal/releases)
2. Run the installer
3. Launch "Claude Cozy" from Start Menu

#### macOS (Apple Silicon - M1/M2/M3/M4)
1. Download `Claude.Cozy_0.6.8_aarch64.dmg` from [Releases](https://github.com/Hukushiyu/claude_terminal/releases)
2. Open the DMG and drag Claude Cozy to Applications
3. Launch from Applications - **No Gatekeeper warning!** ✨ (Signed with Developer ID)

#### macOS (Intel)
1. Download `Claude.Cozy_0.6.8_x64.dmg` from [Releases](https://github.com/Hukushiyu/claude_terminal/releases)
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
   - Hover over files in the tree
   - Click the @ button to insert file references
   - Or type `@path/to/file` manually

4. **Approve Tool Use**
   - When Claude needs to read/write files, a permission prompt appears
   - Review the operation and click "Approve"
   - Subsequent operations execute without prompting (session-based)

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+O` | Open project folder |
| `Ctrl+/` | Toggle help modal |
| `Ctrl+Enter` | Send message |
| `Ctrl+Shift+F` | Focus file search |
| `Ctrl+,` | Open settings |

*Use `Cmd` instead of `Ctrl` on macOS*

### Slash Commands

Use these commands in the chat input:

- `/reset-permissions` - Reset tool execution permissions
- `/clear-history` - Clear conversation history
- `/help` - Show commands and shortcuts

---

## 🏗️ Built With

- **[Tauri 2.x](https://tauri.app/)** - Desktop app framework
- **[Rust](https://www.rust-lang.org/)** - Backend runtime
- **[React 18](https://react.dev/)** - UI framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[Zustand](https://github.com/pmndrs/zustand)** - State management
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
   git clone https://github.com/Hukushiyu/claude_terminal.git
   cd claude_terminal
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
- **[CLAUDE.md](CLAUDE.md)** - Detailed technical documentation for developers

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

- **macOS Gatekeeper** - App is unsigned, requires right-click → Open on first launch
- **HTML5 Drag & Drop** - File drag-drop disabled (Tauri limitation), use @ button instead

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

- **Issues**: [GitHub Issues](https://github.com/Hukushiyu/claude_terminal/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Hukushiyu/claude_terminal/discussions)

---

<div align="center">
  <sub>Built with ❤️ by the Claude Cozy team</sub>
</div>
