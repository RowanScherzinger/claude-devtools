import { useState } from 'react';

import type { UserGroup } from '@renderer/types/groups';

import { formatTime, truncate } from './terminalFormatters';

const TEXT_PREVIEW_MAX = 300;

interface Props {
  group: UserGroup;
}

export function TerminalUserItem({ group }: Props) {
  const { content, timestamp } = group;
  const rawText = content.rawText ?? content.text ?? '';
  const [showFull, setShowFull] = useState(false);

  const displayText = showFull ? rawText : truncate(rawText, TEXT_PREVIEW_MAX);
  const isTruncated = rawText.length > TEXT_PREVIEW_MAX;

  return (
    <div className="py-1.5">
      {/* Header line */}
      <div className="flex items-baseline gap-2">
        <span style={{ color: 'var(--color-text-muted)' }}>▶</span>
        <span style={{ color: 'var(--color-text-muted)' }}>[{formatTime(timestamp)}]</span>
        <span style={{ color: 'var(--color-text)' }} className="font-semibold">
          You
        </span>
      </div>

      {/* Text content */}
      {rawText && (
        <div className="mt-0.5 pl-4" style={{ color: 'var(--color-text)' }}>
          <span className="whitespace-pre-wrap break-words">{displayText}</span>
          {isTruncated && (
            <button
              onClick={() => setShowFull((v) => !v)}
              className="ml-1"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {showFull ? '[show less]' : `[+${rawText.length - TEXT_PREVIEW_MAX} chars]`}
            </button>
          )}
        </div>
      )}

      {/* Images */}
      {content.images.length > 0 && (
        <div className="mt-0.5 pl-4" style={{ color: 'var(--color-text-muted)' }}>
          [{content.images.length} image{content.images.length !== 1 ? 's' : ''} attached]
        </div>
      )}

      {/* File references */}
      {content.fileReferences.length > 0 && (
        <div className="mt-0.5 pl-4 flex flex-wrap gap-x-2">
          {content.fileReferences.map((ref, i) => (
            <span key={i} style={{ color: 'var(--color-text-muted)' }}>
              @{ref.path}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
