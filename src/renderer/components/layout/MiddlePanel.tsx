import React from 'react';

import { useTabUI } from '@renderer/hooks/useTabUI';
import { Terminal } from 'lucide-react';

import { TerminalView } from '../chat/terminal/TerminalView';
import { ChatHistory } from '../chat/ChatHistory';
import { SearchBar } from '../search/SearchBar';

interface MiddlePanelProps {
  /** Tab ID for per-tab state isolation (scroll position, etc.) */
  tabId?: string;
}

export const MiddlePanel: React.FC<MiddlePanelProps> = ({ tabId }) => {
  const { isTerminalMode, toggleTerminalMode } = useTabUI();

  return (
    <div className="relative flex h-full flex-col">
      <SearchBar tabId={tabId} />
      {/* View toggle bar */}
      <div
        className="flex items-center justify-end border-b px-3 py-1"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <button
          onClick={toggleTerminalMode}
          title={isTerminalMode ? 'Switch to rich view' : 'Switch to terminal view'}
          className="flex items-center gap-1.5 rounded px-2 py-0.5 text-xs transition-colors"
          style={{
            backgroundColor: isTerminalMode ? 'var(--color-surface-raised)' : 'transparent',
            color: isTerminalMode ? 'var(--color-text)' : 'var(--color-text-muted)',
            border: '1px solid var(--color-border-emphasis)',
          }}
        >
          <Terminal className="size-3" />
          <span>{isTerminalMode ? 'Rich view' : 'Terminal'}</span>
        </button>
      </div>
      {isTerminalMode ? <TerminalView tabId={tabId} /> : <ChatHistory tabId={tabId} />}
    </div>
  );
};
