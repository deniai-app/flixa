import { useEffect, useRef, useState } from 'react';
import { InputArea } from './components/InputArea';
import { MessageList } from './components/MessageList';
import { useMessages, useVSCode } from './hooks';

export default function App() {
	const {
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
		showUsageDetail,
		login,
		openBilling,
	} = useVSCode();

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const [inputText, setInputText] = useState('');

	useEffect(() => {
		ready();
	}, [ready]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	});

	const handleSendMessage = (text: string) => {
		if (!text.trim() || isLoading) return;
		sendMessage(text);
		setInputText('');
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
		}
	};

	const handleStop = () => {
		stopAgent();
	};

	const handleUsageClick = () => {
		showUsageDetail();
	};

	const handleLogin = () => {
		login();
	};

	const handleOpenBilling = () => {
		openBilling();
	};

	return (
		<div className="flex flex-col h-full">
			<MessageList
				messages={messages}
				isLoading={isLoading}
				streamingText={streamingText}
				messagesEndRef={messagesEndRef}
			/>
			<InputArea
				agentMode={agentMode}
				sessions={sessions}
				currentSessionId={currentSessionId}
				onSessionChange={handleSessionChange}
				approvalMode={approvalMode}
				selectedModel={selectedModel}
				availableModels={availableModels}
				isLoading={isLoading}
				agentRunning={agentRunning}
				text={inputText}
				onTextChange={setInputText}
				onSendMessage={handleSendMessage}
				onModeChange={handleModeChange}
				onApprovalChange={handleApprovalChange}
				onModelChange={handleModelChange}
				onNewChat={handleNewChat}
				onDeleteChat={handleDeleteChat}
				onStop={handleStop}
				usageData={usageData}
				isLoggedIn={isLoggedIn}
				onUsageClick={handleUsageClick}
				onLogin={handleLogin}
				onOpenBilling={handleOpenBilling}
			/>
		</div>
	);
}
