import type { ChatItem } from '@renderer/types/groups';

import { TerminalAIItem } from './TerminalAIItem';
import { TerminalCompactItem } from './TerminalCompactItem';
import { TerminalSystemItem } from './TerminalSystemItem';
import { TerminalUserItem } from './TerminalUserItem';

interface Props {
  item: ChatItem;
  forceExpanded: boolean | null;
}

export function TerminalItem({ item, forceExpanded }: Props) {
  return (
    <div className="border-b" style={{ borderColor: 'var(--color-border)' }}>
      {item.type === 'user' && <TerminalUserItem group={item.group} />}
      {item.type === 'ai' && (
        <TerminalAIItem group={item.group} forceExpanded={forceExpanded} />
      )}
      {item.type === 'system' && <TerminalSystemItem group={item.group} />}
      {item.type === 'compact' && <TerminalCompactItem group={item.group} />}
    </div>
  );
}
