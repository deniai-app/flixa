import { useCallback } from 'react';
import { vscode } from '../vscode';

export interface UseVSCodeReturn {
	sendMessage: (text: string) => void;
	toggleAgentMode: (enabled: boolean) => void;
	setApprovalMode: (mode: string) => void;
	setModel: (model: string) => void;
	switchChat: (sessionId: string) => void;
	newChat: () => void;
	deleteChat: (sessionId: string) => void;
	stopAgent: () => void;
	ready: () => void;
}

export function useVSCode(): UseVSCodeReturn {
	const sendMessage = useCallback((text: string) => {
		vscode.postMessage({ type: 'sendMessage', message: text });
	}, []);

	const toggleAgentMode = useCallback((enabled: boolean) => {
		vscode.postMessage({ type: 'toggleAgentMode', enabled });
	}, []);

	const setApprovalMode = useCallback((mode: string) => {
		vscode.postMessage({ type: 'setApprovalMode', mode });
	}, []);

	const setModel = useCallback((model: string) => {
		vscode.postMessage({ type: 'setModel', model });
	}, []);

	const switchChat = useCallback((sessionId: string) => {
		vscode.postMessage({ type: 'switchChat', sessionId });
	}, []);

	const newChat = useCallback(() => {
		vscode.postMessage({ type: 'newChat' });
	}, []);

	const deleteChat = useCallback((sessionId: string) => {
		vscode.postMessage({ type: 'deleteChat', sessionId });
	}, []);

	const stopAgent = useCallback(() => {
		vscode.postMessage({ type: 'stopAgent' });
	}, []);

	const ready = useCallback(() => {
		vscode.postMessage({ type: 'ready' });
	}, []);

	return {
		sendMessage,
		toggleAgentMode,
		setApprovalMode,
		setModel,
		switchChat,
		newChat,
		deleteChat,
		stopAgent,
		ready,
	};
}
