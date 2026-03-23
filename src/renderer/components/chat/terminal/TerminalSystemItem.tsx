import { useState } from 'react';

import type { SystemGroup } from '@renderer/types/groups';

import { formatTime, truncate } from './terminalFormatters';

const PREVIEW_MAX = 300;

interface Props {
  group: SystemGroup;
}

export function TerminalSystemItem({ group }: Props) {
  const { commandOutput, commandName, timestamp } = group;
  const [showFull, setShowFull] = useState(false);

  const preview = truncate(commandOutput, PREVIEW_MAX);
  const isTruncated = commandOutput.length > PREVIEW_MAX;

  return (
    <div className="py-1.5">
      <div className="flex items-baseline gap-2" style={{ color: 'var(--color-text-muted)' }}>
        <span>╌</span>
        <span>[{formatTime(timestamp)}]</span>
        <span>system{commandName ? ` · ${commandName}` : ''}</span>
      </div>
      <div className="mt-0.5 pl-4" style={{ color: 'var(--color-text-secondary)' }}>
        <span className="whitespace-pre-wrap break-words">
          {showFull ? commandOutput : preview}
        </span>
        {isTruncated && (
          <button
            onClick={() => setShowFull((v) => !v)}
            className="ml-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {showFull ? '[show less]' : `[+${commandOutput.length - PREVIEW_MAX} chars]`}
          </button>
        )}
      </div>
    </div>
  );
}
