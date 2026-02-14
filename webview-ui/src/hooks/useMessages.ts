import { useEffect, useState } from 'react';
import type { ChatMessage, ChatSession, UsageData } from '../types';

export interface UseMessagesReturn {
	messages: ChatMessage[];
	sessions: ChatSession[];
	currentSessionId: string;
	agentMode: boolean;
	approvalMode: string;
	selectedModel: string;
	availableModels: string[];
	isLoading: boolean;
	agentRunning: boolean;
	streamingText: string;
	usageData: UsageData | null;
	isLoggedIn: boolean;
	setAgentMode: (mode: boolean) => void;
	setApprovalMode: (mode: string) => void;
	setSelectedModel: (model: string) => void;
}

export function useMessages(): UseMessagesReturn {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [sessions, setSessions] = useState<ChatSession[]>([]);
	const [currentSessionId, setCurrentSessionId] = useState('');
	const [agentMode, setAgentMode] = useState(true);
	const [approvalMode, setApprovalMode] = useState('AUTO_APPROVE');
	const [selectedModel, setSelectedModel] = useState('openai/gpt-5.3-codex');
	const [availableModels, setAvailableModels] = useState<string[]>([
		'openai/gpt-5.3-codex',
	]);
	const [isLoading, setIsLoading] = useState(false);
	const [agentRunning, setAgentRunning] = useState(false);
	const [streamingText, setStreamingText] = useState('');
	const [usageData, setUsageData] = useState<UsageData | null>(null);
	const [isLoggedIn, setIsLoggedIn] = useState(false);

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
					if (data.isLoggedIn !== undefined) {
						setIsLoggedIn(data.isLoggedIn);
					}
					break;
				case 'setLoading':
					setIsLoading(data.loading);
					setAgentRunning(data.agentRunning);
					break;
				case 'updateSessions':
					setSessions(data.sessions);
					setCurrentSessionId(data.currentSessionId);
					break;
				case 'streamingUpdate':
					setStreamingText(data.text || '');
					break;
				case 'updateUsage':
					setUsageData(data.usage);
					if (data.isLoggedIn !== undefined) {
						setIsLoggedIn(data.isLoggedIn);
					}
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
		agentMode,
		approvalMode,
		selectedModel,
		availableModels,
		isLoading,
		agentRunning,
		streamingText,
		usageData,
		isLoggedIn,
		setAgentMode,
		setApprovalMode,
		setSelectedModel,
	};
}
