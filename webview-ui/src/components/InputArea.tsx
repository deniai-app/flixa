import { useState, useEffect, useRef, type KeyboardEvent, type ChangeEvent } from 'react';
import { CustomDropdown } from './CustomDropdown';

interface InputAreaProps {
  agentMode: boolean;
  approvalMode: string;
  selectedModel: string;
  availableModels: string[];
  isLoading: boolean;
  agentRunning: boolean;
  onSendMessage: (text: string) => void;
  onModeChange: (mode: string) => void;
  onApprovalChange: (mode: string) => void;
  onModelChange: (model: string) => void;
  onStop: () => void;
}

const ChatIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const AgentIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const AllApproveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const AutoApproveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const SafeApproveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const ManualApproveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
  </svg>
);

const modeOptions = [
  {
    value: 'chat',
    label: 'Chat',
    description: 'Simple chat mode for asking questions and discussing code without executing actions.',
    icon: <ChatIcon />,
  },
  {
    value: 'agent',
    label: 'Agent',
    description: 'Autonomous agent mode that can execute shell commands, edit files, and perform complex tasks.',
    icon: <AgentIcon />,
  },
];

const approvalOptions = [
  {
    value: 'ALL_APPROVE',
    label: 'All Approve',
    description: 'Execute all actions immediately without any confirmation. Use with caution.',
    icon: <AllApproveIcon />,
  },
  {
    value: 'AUTO_APPROVE',
    label: 'Auto',
    description: 'AI safety check for shell commands, auto-execute file operations.',
    icon: <AutoApproveIcon />,
  },
  {
    value: 'SAFE_APPROVE',
    label: 'Safe Approve',
    description: 'User confirmation for shell commands, auto-execute safe file operations.',
    icon: <SafeApproveIcon />,
  },
  {
    value: 'MANUAL_APPROVE',
    label: 'Manual Approve',
    description: 'User confirmation required for all actions. Most secure option.',
    icon: <ManualApproveIcon />,
  },
];

const getModelLabel = (model: string): string => {
  const labels: Record<string, string> = {
    'openai/gpt-5.2-codex': 'GPT-5.2 Codex',
    'openai/gpt-5.2': 'GPT-5.2',
    'anthropic/claude-sonnet-4.5': 'Sonnet 4.5',
    'glm-4.6': 'GLM-4.6',
    'grok-code-fast-1': 'Grok Code',
    'google/gemini-3-pro-preview': 'Gemini 3 Pro',
    'google/gemini-3-flash-preview': 'Gemini 3 Flash',
  };
  return labels[model] || model;
};

export function InputArea({
  agentMode,
  approvalMode,
  selectedModel,
  availableModels,
  isLoading,
  agentRunning,
  onSendMessage,
  onModeChange,
  onApprovalChange,
  onModelChange,
  onStop,
}: InputAreaProps) {
  const [text, setText] = useState('');
  const [isCompact, setIsCompact] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const modelOptions = availableModels.map(model => ({
    value: model,
    label: getModelLabel(model),
    description: "",
  }));

  useEffect(() => {
    const checkWidth = () => {
      if (containerRef.current) {
        setIsCompact(containerRef.current.offsetWidth < 280);
      }
    };
    checkWidth();
    const resizeObserver = new ResizeObserver(checkWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (text.trim() && !isLoading) {
      onSendMessage(text);
      setText('');
    }
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  return (
    <div className="p-2.5" ref={containerRef}>
      <div className="bg-input-bg border border-input-border rounded-lg overflow-hidden">
        <textarea
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Plan, @ for context, / for commands"
          rows={1}
          disabled={isLoading}
          className="w-full px-2.5 py-2 bg-transparent text-input-foreground resize-none min-h-[36px] max-h-[160px] text-xs leading-relaxed outline-none placeholder:text-input-placeholder disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="flex items-center justify-between px-1.5 py-1 border-t border-input-border">
          <div className="flex items-center gap-0.5">
            <CustomDropdown
              options={modeOptions}
              value={agentMode ? 'agent' : 'chat'}
              onChange={onModeChange}
              iconOnly={isCompact}
            />
            {agentMode && (
              <CustomDropdown
                options={approvalOptions}
                value={approvalMode}
                onChange={onApprovalChange}
                iconOnly={isCompact}
              />
            )}
            <CustomDropdown
              options={modelOptions}
              value={selectedModel}
              onChange={onModelChange}
            />
          </div>
          <div className="flex items-center gap-0.5">
            {agentRunning ? (
              <button
                type="button"
                onClick={onStop}
                className="p-1 text-error hover:text-error hover:bg-error-bg rounded transition-all"
                title="Stop"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={isLoading || !text.trim()}
                className="p-1 text-foreground-subtle hover:text-foreground hover:bg-surface-hover rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title="Send"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
