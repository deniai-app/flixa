import * as vscode from 'vscode';
import { generateText } from 'ai';
import { getAnthropicProvider, getModel } from '../llm/provider';

export class FlixaInlineCompletionProvider implements vscode.InlineCompletionItemProvider {
	private lastRequestTime = 0;
	private debounceDelay = 300;
	private cache: Map<string, { completion: string; timestamp: number }> = new Map();
	private cacheTimeout = 5000;

	async provideInlineCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		context: vscode.InlineCompletionContext,
		token: vscode.CancellationToken
	): Promise<vscode.InlineCompletionItem[] | undefined> {
		const config = vscode.workspace.getConfiguration('flixa');
		const enabled = config.get<boolean>('inlineCompletion.enabled', false);

		if (!enabled) {
			return undefined;
		}

		if (token.isCancellationRequested) {
			return undefined;
		}

		const now = Date.now();
		if (now - this.lastRequestTime < this.debounceDelay) {
			return undefined;
		}
		this.lastRequestTime = now;

		const currentLine = document.lineAt(position.line).text;
		const precedingText = currentLine.substring(0, position.character);

		if (!precedingText.trim()) {
			return undefined;
		}

		const cacheKey = `${document.fileName}:${position.line}:${precedingText}`;
		const cached = this.cache.get(cacheKey);
		if (cached && now - cached.timestamp < this.cacheTimeout) {
			return [{
				insertText: cached.completion,
				range: new vscode.Range(position, position),
			}];
		}

		try {
			const provider = getAnthropicProvider();
			const model = getModel();

			const contextLines = 5;
			const startLine = Math.max(0, position.line - contextLines);
			const endLine = Math.min(document.lineCount - 1, position.line + contextLines);
			const contextText = [];
			for (let i = startLine; i <= endLine; i++) {
				contextText.push(document.lineAt(i).text);
			}

			const abortController = new AbortController();
			const listener = token.onCancellationRequested(() => {
				abortController.abort();
			});

			const { text } = await generateText({
				model: provider(model),
				system: 'You are a code completion AI. Suggest a natural continuation of the code. Keep it concise (under 80 chars). Return ONLY the completion text that follows the cursor, no explanation, no markdown.',
				prompt: `File: ${document.fileName}\nLanguage: ${document.languageId}\n\nContext:\n${contextText.join('\n')}\n\nCursor is at the end of line ${position.line + 1}. Complete the code naturally:`,
				abortSignal: abortController.signal,
			});

			listener.dispose();

			if (token.isCancellationRequested) {
				return undefined;
			}

			const completion = text?.trim() || '';
			if (!completion) {
				return undefined;
			}

			this.cache.set(cacheKey, { completion, timestamp: now });

			return [{
				insertText: completion,
				range: new vscode.Range(position, position),
			}];
		} catch (error) {
			if (token.isCancellationRequested) {
				return undefined;
			}
			console.error('[Flixa] Inline completion error:', error);
			return undefined;
		}
	}
}
