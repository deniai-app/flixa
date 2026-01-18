# Flixa

AI-powered code implementation assistant for VS Code.

## Features

- AI chat interface in sidebar
- Inline code editing with `Ctrl+I` / `Cmd+I`
- Agent mode with shell command execution
- Diff preview and apply
- Auto context (file list, git status, package.json, tsconfig.json)
- Multiple AI model support (OpenAI, Anthropic, Google, etc.)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   cd webview-ui && bun install
   ```
3. Build the extension:
   ```bash
   bun run compile
   ```
4. Press `F5` in VS Code to launch the extension in debug mode

## Usage

- Open the Flixa sidebar from the activity bar
- Use the chat to ask AI for code implementation
- Use `Ctrl+I` / `Cmd+I` for inline editing
- Toggle agent mode to allow AI to execute shell commands

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `flixa.model` | `openai/gpt-5.2-codex` | AI model to use |
| `flixa.agentApprovalMode` | `SAFE_APPROVE` | Approval mode for agent actions |
| `flixa.autoContext.enabled` | `true` | Enable auto context feature |

## Commands

- `Flixa: Open Chat` - Open the chat panel
- `Flixa: Inline Edit` - Start inline editing
- `Flixa: Toggle Agent Mode` - Toggle agent mode
- `Flixa: Set Approval Mode` - Set approval mode for agent actions
- `Flixa: Apply Diff` - Apply a diff to the current file

## License

MIT
