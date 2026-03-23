import { useState } from 'react';

import { useStore } from '@renderer/store';
import { useShallow } from 'zustand/react/shallow';

import { TerminalItem } from './TerminalItem';

interface Props {
  tabId?: string;
}

export function TerminalView({ tabId }: Props) {
  // Mirror the exact pattern from ChatHistory for per-tab conversation access
  const { conversation, conversationLoading } = useStore(
    useShallow((s) => {
      const td = tabId ? s.tabSessionData[tabId] : null;
      return {
        conversation: td?.conversation ?? s.conversation,
        conversationLoading: td?.conversationLoading ?? s.conversationLoading,
      };
    })
  );

  // null = use local state per item; true/false = force all expanded/collapsed
  const [forceExpanded, setForceExpanded] = useState<boolean | null>(null);

  if (conversationLoading) {
    return (
      <div
        className="flex flex-1 items-center justify-center font-mono text-xs"
        style={{ color: 'var(--color-text-muted)' }}
      >
        loading…
      </div>
    );
  }

  if (!conversation || conversation.items.length === 0) {
    return (
      <div
        className="flex flex-1 items-center justify-center font-mono text-xs"
        style={{ color: 'var(--color-text-muted)' }}
      >
        no session data
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 border-b px-3 py-1 font-mono text-xs"
        style={{
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-muted)',
        }}
      >
        <span>
          {conversation.items.length} item{conversation.items.length !== 1 ? 's' : ''}
        </span>
        <span style={{ color: 'var(--color-border-emphasis)' }}>│</span>
        <button
          onClick={() => setForceExpanded(true)}
          className="hover:underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          expand all
        </button>
        <button
          onClick={() => setForceExpanded(false)}
          className="hover:underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          collapse all
        </button>
        <button
          onClick={() => setForceExpanded(null)}
          className="hover:underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          reset
        </button>
      </div>

      {/* Log feed */}
      <div
        className="flex-1 overflow-y-auto px-4 py-2 font-mono text-xs leading-snug"
        style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
      >
        {conversation.items.map((item) => (
          <TerminalItem key={item.group.id} item={item} forceExpanded={forceExpanded} />
        ))}
      </div>
    </div>
  );
}
