import type { ChatContext, SerializedActionResult } from '../types';
import { log } from '../logger';
import { formatSessionResults } from '../utils/format';
import { formatAutoContext } from '../autoContext';

export function buildChatMessages(
	context: ChatContext
): Array<{ role: 'user' | 'assistant'; content: string }> {
	const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

	let isFirstUserMessage = true;
	for (const msg of context.sessionMessages) {
		if (msg.role === 'user') {
			if (isFirstUserMessage) {
				isFirstUserMessage = false;
				let content = `User message: ${msg.content}\n\n`;

				const autoContextText = formatAutoContext(context.autoContext);
				if (autoContextText) {
					content += `${autoContextText}\n\n`;
				}

				if (context.activeFilePath) {
					content += `Active file: ${context.activeFilePath}\nLanguage: ${context.languageId}\n\n`;
				}
				if (context.activeSelection) {
					content += `Selected code:\n\`\`\`\n${context.activeSelection}\n\`\`\`\n\n`;
				}
				if (context.activeFileText) {
					content += `Full file content:\n\`\`\`\n${context.activeFileText}\n\`\`\`\n\n`;
				}
				if (context.diagnostics.length > 0) {
					content += `Current diagnostics/problems:\n${context.diagnostics.join('\n')}\n\n`;
				}
				if (context.gitDiff) {
					content += `Current git diff:\n\`\`\`\n${context.gitDiff}\n\`\`\`\n\n`;
				}
				messages.push({ role: 'user', content });
			} else {
				messages.push({ role: 'user', content: msg.content });
			}
		} else if (msg.role === 'assistant') {
			messages.push({ role: 'assistant', content: msg.content });
		} else if (msg.role === 'result' && msg.results) {
			const resultsText = formatSessionResults(msg.results);
			messages.push({ role: 'user', content: resultsText });
		}
	}

	return messages;
}

export function buildAgentMessages(
	context: ChatContext
): Array<{ role: 'user' | 'assistant'; content: string }> {
	const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

	let isFirstUserMessage = true;
	for (const msg of context.sessionMessages) {
		if (msg.role === 'user') {
			if (isFirstUserMessage) {
				isFirstUserMessage = false;
				let content = `User request: ${msg.content}\n\n`;

				const autoContextText = formatAutoContext(context.autoContext);
				if (autoContextText) {
					content += `${autoContextText}\n\n`;
				}

				if (context.activeFilePath) {
					content += `Active file: ${context.activeFilePath}\nLanguage: ${context.languageId}\n\n`;
				}
				if (context.activeSelection) {
					content += `Selected code:\n\`\`\`\n${context.activeSelection}\n\`\`\`\n\n`;
				}
				if (context.activeFileText) {
					content += `Full file content:\n\`\`\`\n${context.activeFileText}\n\`\`\`\n\n`;
				}
				messages.push({ role: 'user', content });
			} else {
				messages.push({ role: 'user', content: msg.content });
			}
		} else if (msg.role === 'assistant') {
			if (msg.content.startsWith('[Agent - Step')) {
				continue;
			}
			messages.push({ role: 'assistant', content: msg.content });
		} else if (msg.role === 'result' && msg.results) {
			const resultsText = formatSessionResults(msg.results);
			log('[Flixa] agent result message to AI:', resultsText);
			messages.push({ role: 'user', content: resultsText });
		}
	}

	return messages;
}
