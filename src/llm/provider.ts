import { createOpenAI } from '@ai-sdk/openai';
import * as vscode from 'vscode';
import { getFlixaApiBaseUrl } from '../usage/service';

const FLIXA_BASE_URL = getFlixaApiBaseUrl();

const OPENAI_BASE_URL = `${FLIXA_BASE_URL}/v1/agent/`

let _apiKey: string | undefined;

export function setApiKey(apiKey: string | undefined): void {
	_apiKey = apiKey;
}

export function getApiKey(): string | undefined {
	return _apiKey;
}

export function getAnthropicProvider() {
	console.log('[Flixa] Creating OpenAI provider with base URL:', OPENAI_BASE_URL);
	return createOpenAI({ apiKey: _apiKey || 'anonymous', baseURL: OPENAI_BASE_URL }).chat;
}

export function getModel(): string {
	const config = vscode.workspace.getConfiguration('flixa');
	const model = config.get<string>('model') || 'openai/gpt-5.2-codex';
	console.log('[Flixa] Using model:', model);
	return model;
}

export function getAvailableModels(): string[] {
	const config = vscode.workspace.getConfiguration('flixa');
	const modelProperty = config.inspect<string>('model');
	if (modelProperty?.defaultValue !== undefined) {
		const enumValues = [
			'openai/gpt-5.2-codex',
			'openai/gpt-5.2',
			'anthropic/claude-sonnet-4.5',
			'anthropic/claude-opus-4.6',
			'glm-4.6',
			'grok-code-fast-1',
			'google/gemini-3-pro-preview',
			'google/gemini-3-flash-preview',
		];
		return enumValues;
	}
	return [getModel()];
}

export async function setModel(model: string): Promise<void> {
	const config = vscode.workspace.getConfiguration('flixa');
	await config.update('model', model, vscode.ConfigurationTarget.Global);
}
