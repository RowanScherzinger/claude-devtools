import type { CompactGroup } from '@renderer/types/groups';

import { formatTime, formatTokensShort } from './terminalFormatters';

interface Props {
  group: CompactGroup;
}

export function TerminalCompactItem({ group }: Props) {
  const { timestamp, tokenDelta } = group;

  const freed = tokenDelta ? Math.abs(tokenDelta.delta) : 0;
  const freedStr = tokenDelta ? ` · freed ${formatTokensShort(freed)} tok` : '';

  return (
    <div className="py-1.5 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
      <span>━━━━</span>
      <span>compacted [{formatTime(timestamp)}]{freedStr}</span>
      <span>━━━━</span>
    </div>
  );
}
