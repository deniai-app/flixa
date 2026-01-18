import * as vscode from 'vscode';
import type { ChatContext, ChatHistoryMessage, SessionMessage, SerializedActionResult, AutoContextData } from '../types';
import { gatherAutoContext } from '../autoContext';

export interface ChatMessage {
	role: 'user' | 'assistant' | 'system' | 'result' | 'executing';
	content: string;
	results?: SerializedActionResult[];
	executingAction?: string;
	executingOutput?: string;
}

export async function gatherChatContext(
	userMessage: string,
	getMessages: () => ChatMessage[],
	getSessionMessages: () => SessionMessage[]
): Promise<ChatContext> {
	const editor = vscode.window.activeTextEditor;

	let activeSelection = '';
	let activeFileText = '';
	let activeFilePath = '';
	let languageId = '';
	const diagnostics: string[] = [];
	let gitDiff = '';

	if (editor) {
		const document = editor.document;
		activeFilePath = document.uri.fsPath;
		languageId = document.languageId;
		activeFileText = document.getText();

		if (!editor.selection.isEmpty) {
			activeSelection = document.getText(editor.selection);
		}

		const fileDiagnostics = vscode.languages.getDiagnostics(document.uri);
		for (const diag of fileDiagnostics) {
			diagnostics.push(
				`Line ${diag.range.start.line + 1}: ${diag.message} (${vscode.DiagnosticSeverity[diag.severity]})`
			);
		}
	}

	try {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (workspaceFolders && workspaceFolders.length > 0) {
			const gitExtension = vscode.extensions.getExtension('vscode.git');
			if (gitExtension) {
				const git = gitExtension.exports.getAPI(1);
				if (git.repositories.length > 0) {
					const repo = git.repositories[0];
					gitDiff = (await repo.diff()) || '';
				}
			}
		}
	} catch {
		gitDiff = '';
	}

	const history: ChatHistoryMessage[] = getMessages()
		.filter((m) => m.role === 'user' || m.role === 'assistant')
		.map((m) => ({
			role: m.role as 'user' | 'assistant',
			content: m.content,
		}));

	const sessionMessages = getSessionMessages();

	const autoContext = await gatherAutoContext();

	return {
		userMessage,
		activeSelection,
		activeFileText,
		activeFilePath,
		languageId,
		diagnostics,
		gitDiff,
		history,
		sessionMessages,
		autoContext,
	};
}
