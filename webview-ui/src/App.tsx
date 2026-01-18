import { useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { InputArea } from './components/InputArea';
import { MessageList } from './components/MessageList';
import { useMessages, useVSCode } from './hooks';

export default function App() {
	const {
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
	} = useMessages();

	const {
		sendMessage,
		toggleAgentMode,
		setApprovalMode: setApprovalModeVSCode,
		setModel: setModelVSCode,
		switchChat,
		newChat,
		deleteChat,
		stopAgent,
		ready,
	} = useVSCode();

	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		ready();
	}, [ready]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	});

	const handleSendMessage = (text: string) => {
		if (!text.trim() || isLoading) return;
		sendMessage(text);
	};

	const handleModeChange = (mode: string) => {
		const isAgent = mode === 'agent';
		setAgentMode(isAgent);
		toggleAgentMode(isAgent);
	};

	const handleApprovalChange = (mode: string) => {
		setApprovalMode(mode);
		setApprovalModeVSCode(mode);
	};

	const handleModelChange = (model: string) => {
		setSelectedModel(model);
		setModelVSCode(model);
	};

	const handleSessionChange = (sessionId: string) => {
		switchChat(sessionId);
	};

	const handleNewChat = () => {
		newChat();
	};

	const handleDeleteChat = (sessionId: string) => {
		if (sessions.length > 1) {
			deleteChat(sessionId);
			setOpenTabs(prev => prev.filter(id => id !== sessionId));
		}
	};

	const handleCloseTab = (sessionId: string) => {
		setOpenTabs(prev => {
			const newTabs = prev.filter(id => id !== sessionId);
			if (sessionId === currentSessionId && newTabs.length > 0) {
				switchChat(newTabs[newTabs.length - 1]);
			}
			return newTabs;
		});
	};

	const handleOpenTab = (sessionId: string) => {
		setOpenTabs(prev => {
			if (!prev.includes(sessionId)) {
				return [...prev, sessionId];
			}
			return prev;
		});
	};

	const handleStop = () => {
		stopAgent();
	};

	return (
		<div className="flex flex-col h-full">
			<Header
				sessions={sessions}
				currentSessionId={currentSessionId}
				openTabs={openTabs}
				onSessionChange={handleSessionChange}
				onNewChat={handleNewChat}
				onDeleteChat={handleDeleteChat}
				onCloseTab={handleCloseTab}
				onOpenTab={handleOpenTab}
			/>
			<MessageList
				messages={messages}
				isLoading={isLoading}
				streamingText={streamingText}
				messagesEndRef={messagesEndRef}
			/>
			<InputArea
				agentMode={agentMode}
				approvalMode={approvalMode}
				selectedModel={selectedModel}
				availableModels={availableModels}
				isLoading={isLoading}
				agentRunning={agentRunning}
				onSendMessage={handleSendMessage}
				onModeChange={handleModeChange}
				onApprovalChange={handleApprovalChange}
				onModelChange={handleModelChange}
				onStop={handleStop}
			/>
		</div>
	);
}
