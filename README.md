# Flixa

AI-powered code implementation assistant for VS Code.

## Showcase

### Try: Agent Mode

Rest assured, you can take a break safely.

![Agent mode demo](assets/agent_mode.gif)

### Inline editing

![Inline editing demo](assets/inline_editing.png)

## Features

- AI chat interface in sidebar
- Inline code editing with `Ctrl+I` / `Cmd+I`
- Inline code suggestions while typing (configurable)
- Agent mode with shell command execution
- Safety agent mode (Auto Approve)
- Diff preview and apply
- Auto context (file list, git status, package.json, tsconfig.json)
- Multiple AI model support (OpenAI, Anthropic, Google, etc.)

## Usage

### Inline Suggestions

Inline suggestions provide contextual code completions as you type, similar to GitHub Copilot. To enable:

1. Open VS Code Settings (`Ctrl+,` / `Cmd+,`)
2. Search for "Flixa: Inline Completion Enabled"
3. Enable the setting

Once enabled, suggestions will appear as grayed-out ghost text while typing. Press `Tab` or `Enter` to accept a suggestion.

**Note:** Inline suggestions are disabled by default to avoid unexpected API usage. Enable only when needed.

## License

MIT
