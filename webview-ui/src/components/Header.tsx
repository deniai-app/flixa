import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ChatSession } from '../types';

interface HeaderProps {
  sessions: ChatSession[];
  currentSessionId: string;
  openTabs: string[];
  onSessionChange: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (sessionId: string) => void;
  onCloseTab: (sessionId: string) => void;
  onOpenTab: (sessionId: string) => void;
}

const CloseIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const AddIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const HistoryIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const MoreIcon = () => (
  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
);

export function Header({
  sessions,
  currentSessionId,
  openTabs,
  onSessionChange,
  onNewChat,
  onDeleteChat,
  onCloseTab,
  onOpenTab,
}: HeaderProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const historyButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [historyPosition, setHistoryPosition] = useState({ top: 0, left: 0 });
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const openSessions = sessions.filter(s => openTabs.includes(s.id));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const historyMenu = document.getElementById('history-menu');
      const moreMenu = document.getElementById('more-menu');
      if (historyButtonRef.current && !historyButtonRef.current.contains(e.target as Node)) {
        if (historyMenu && !historyMenu.contains(e.target as Node)) {
          setIsHistoryOpen(false);
        }
      }
      if (menuButtonRef.current && !menuButtonRef.current.contains(e.target as Node)) {
        if (moreMenu && !moreMenu.contains(e.target as Node)) {
          setIsMenuOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isHistoryOpen && historyButtonRef.current) {
      const rect = historyButtonRef.current.getBoundingClientRect();
      setHistoryPosition({
        top: rect.bottom + 4,
        left: Math.max(8, rect.left - 100),
      });
    }
  }, [isHistoryOpen]);

  useEffect(() => {
    if (isMenuOpen && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.right - 150,
      });
    }
  }, [isMenuOpen]);

  const handleCloseTab = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    onCloseTab(sessionId);
  };

  const handleOpenFromHistory = (sessionId: string) => {
    onOpenTab(sessionId);
    onSessionChange(sessionId);
    setIsHistoryOpen(false);
  };

  const truncateName = (name: string, maxLength: number = 12) => {
    if (name.length <= maxLength) return name;
    return name.slice(0, maxLength - 2) + '..';
  };

  const historyMenu = isHistoryOpen && createPortal(
    <div
      id="history-menu"
      className="fixed z-[9999] min-w-[180px] max-h-[300px] overflow-y-auto bg-menu-bg border border-menu-border rounded-lg shadow-[0_12px_24px_var(--color-shadow)]"
      style={{
        top: historyPosition.top,
        left: historyPosition.left,
      }}
    >
      {sessions.length === 0 ? (
        <div className="px-3 py-2 text-xs text-foreground-subtle">No conversations</div>
      ) : (
        sessions.map((session) => (
          <button
            type="button"
            key={session.id}
            className={`w-full px-3 py-2 cursor-pointer transition-colors hover:bg-menu-selected-bg text-xs border-b border-menu-separator last:border-b-0 text-left flex items-center justify-between gap-2 ${
              openTabs.includes(session.id) ? 'text-foreground-subtle' : 'text-menu-foreground'
            }`}
            onClick={() => handleOpenFromHistory(session.id)}
          >
            <span className="truncate">{session.name}</span>
            {openTabs.includes(session.id) && (
              <span className="text-[10px] text-foreground-subtle">open</span>
            )}
          </button>
        ))
      )}
    </div>,
    document.body
  );

  const moreMenu = isMenuOpen && createPortal(
    <div
      id="more-menu"
      className="fixed z-[9999] min-w-[150px] bg-menu-bg border border-menu-border rounded-lg shadow-[0_12px_24px_var(--color-shadow)]"
      style={{
        top: menuPosition.top,
        left: menuPosition.left,
      }}
    >
      <button
        type="button"
        className="w-full px-3 py-2 cursor-pointer transition-colors hover:bg-menu-selected-bg text-xs text-menu-foreground text-left"
        onClick={() => {
          onNewChat();
          setIsMenuOpen(false);
        }}
      >
        New conversation
      </button>
      <button
        type="button"
        className="w-full px-3 py-2 cursor-pointer transition-colors hover:bg-menu-selected-bg text-xs text-error border-t border-menu-separator text-left"
        onClick={() => {
          onDeleteChat(currentSessionId);
          setIsMenuOpen(false);
        }}
      >
        Delete conversation
      </button>
    </div>,
    document.body
  );

  return (
    <div className="px-2 pt-2">
      <div className="bg-input-bg border border-input-border rounded-lg overflow-hidden">
        <div className="flex items-center">
          <button
            type="button"
            ref={historyButtonRef}
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="flex-shrink-0 p-1.5 text-foreground-subtle hover:text-foreground hover:bg-surface-hover transition-all border-r border-input-border"
            title="History"
          >
            <HistoryIcon />
          </button>
          <div className="flex-1 flex items-center overflow-x-auto scrollbar-none">
            {openSessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => onSessionChange(session.id)}
                className={`group flex items-center gap-1 px-2.5 py-1.5 text-xs whitespace-nowrap border-r border-input-border transition-colors ${
                  session.id === currentSessionId
                    ? 'bg-surface-hover text-foreground'
                    : 'text-foreground-subtle hover:text-foreground hover:bg-surface-hover/50'
                }`}
              >
                <span className="truncate max-w-[80px]">{truncateName(session.name)}</span>
                <button
                  type="button"
                  onClick={(e) => handleCloseTab(e, session.id)}
                  className={`p-0.5 rounded hover:bg-error/20 hover:text-error transition-colors ${
                    session.id === currentSessionId
                      ? 'opacity-70 hover:opacity-100'
                      : 'opacity-0 group-hover:opacity-70 hover:!opacity-100'
                  }`}
                  title="Close tab"
                >
                  <CloseIcon />
                </button>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onNewChat}
            className="flex-shrink-0 p-1.5 text-foreground-subtle hover:text-foreground hover:bg-surface-hover transition-all border-l border-input-border"
            title="New Chat"
          >
            <AddIcon />
          </button>
          <button
            type="button"
            ref={menuButtonRef}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex-shrink-0 p-1.5 text-foreground-subtle hover:text-foreground hover:bg-surface-hover transition-all border-l border-input-border"
            title="More"
          >
            <MoreIcon />
          </button>
        </div>
      </div>
      {historyMenu}
      {moreMenu}
    </div>
  );
}
