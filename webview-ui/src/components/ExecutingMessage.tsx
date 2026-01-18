import type { ChatMessage } from '../types';

interface ExecutingMessageProps {
  message: ChatMessage;
}

const TerminalIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export function ExecutingMessage({ message }: ExecutingMessageProps) {
  const lines = message.executingOutput?.split('\n').slice(-15).join('\n') || '';

  return (
    <div className="message-animate">
      <div className="rounded-xl bg-surface-2 border border-border-subtle/50 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 bg-surface-hover/30 border-b border-border-subtle/30">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-info animate-pulse" />
            <TerminalIcon />
          </div>
          <span className="text-[11px] font-medium text-foreground-muted uppercase tracking-wide">Running</span>
          <span className="text-[11px] text-foreground-subtle truncate flex-1">{message.executingAction}</span>
        </div>
        {lines && (
          <div className="p-3">
            <pre className="text-[11px] text-foreground-muted font-mono leading-relaxed max-h-[180px] overflow-y-auto whitespace-pre-wrap">
              {lines}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
