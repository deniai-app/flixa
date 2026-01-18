import { useEffect, useState } from 'react';
import type { ChatMessage, ChatSession } from '../types';

export interface UseMessagesReturn {
	messages: ChatMessage[];
	sessions: ChatSession[];
	currentSessionId: string;
	openTabs: string[];
	agentMode: boolean;
	approvalMode: string;
	selectedModel: string;
	availableModels: string[];
	isLoading: boolean;
	agentRunning: boolean;
	streamingText: string;
	setAgentMode: (mode: boolean) => void;
	setApprovalMode: (mode: string) => void;
	setSelectedModel: (model: string) => void;
	setOpenTabs: React.Dispatch<React.SetStateAction<string[]>>;
}

export function useMessages(): UseMessagesReturn {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [sessions, setSessions] = useState<ChatSession[]>([]);
	const [currentSessionId, setCurrentSessionId] = useState('');
	const [openTabs, setOpenTabs] = useState<string[]>([]);
	const [agentMode, setAgentMode] = useState(true);
	const [approvalMode, setApprovalMode] = useState('AUTO_APPROVE');
	const [selectedModel, setSelectedModel] = useState('openai/gpt-5.2-codex');
	const [availableModels, setAvailableModels] = useState<string[]>([
		'openai/gpt-5.2-codex',
	]);
	const [isLoading, setIsLoading] = useState(false);
	const [agentRunning, setAgentRunning] = useState(false);
	const [streamingText, setStreamingText] = useState('');

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const data = event.data;
			switch (data.type) {
				case 'updateMessages':
					setMessages(data.messages);
					break;
				case 'updateState':
					setAgentMode(data.agentMode);
					setApprovalMode(data.approvalMode);
					if (data.selectedModel) {
						setSelectedModel(data.selectedModel);
					}
					if (data.availableModels) {
						setAvailableModels(data.availableModels);
					}
					break;
				case 'setLoading':
					setIsLoading(data.loading);
					setAgentRunning(data.agentRunning);
					break;
				case 'updateSessions':
					setSessions(data.sessions);
					setCurrentSessionId(data.currentSessionId);
					setOpenTabs(prev => {
						if (!prev.includes(data.currentSessionId)) {
							return [...prev, data.currentSessionId];
						}
						return prev;
					});
					break;
				case 'streamingUpdate':
					setStreamingText(data.text || '');
					break;
			}
		};

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, []);

	return {
		messages,
		sessions,
		currentSessionId,
		openTabs,
		agentMode,
		approvalMode,
		selectedModel,
		availableModels,
		isLoading,
		agentRunning,
		streamingText,
		setAgentMode,
		setApprovalMode,
		setSelectedModel,
		setOpenTabs,
	};
}
