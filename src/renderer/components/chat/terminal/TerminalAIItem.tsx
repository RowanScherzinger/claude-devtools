import { useEffect, useState } from 'react';

import { enhanceAIGroup } from '@renderer/utils/aiGroupEnhancer';

import type { AIGroup } from '@renderer/types/groups';

import { TerminalDisplayItem } from './TerminalDisplayItem';
import { formatDurationShort, formatTime, formatTokensShort, truncate } from './terminalFormatters';

const LAST_OUTPUT_PREVIEW_MAX = 300;

interface Props {
  group: AIGroup;
  /** External force-expand signal. Increments to expand all, decrements to collapse all. */
  forceExpanded: boolean | null;
}

export function TerminalAIItem({ group, forceExpanded }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);

  // Respond to external force-expand/collapse
  useEffect(() => {
    if (forceExpanded !== null) {
      setIsExpanded(forceExpanded);
    }
  }, [forceExpanded]);

  const enhanced = enhanceAIGroup(group);
  const { displayItems, lastOutput, itemsSummary, mainModel, durationMs, tokens } = enhanced;

  const totalTokens = tokens.input + tokens.output;
  const modelName = mainModel?.name ?? 'Claude';
  const timeStr = formatTime(group.startTime);
  const durStr = formatDurationShort(durationMs);
  const tokStr = formatTokensShort(totalTokens);

  // Last output text
  let lastOutputText = '';
  if (lastOutput) {
    if (lastOutput.type === 'text' && lastOutput.text) {
      lastOutputText = lastOutput.text;
    } else if (lastOutput.type === 'tool_result' && lastOutput.toolResult) {
      lastOutputText = lastOutput.toolResult;
    } else if (lastOutput.type === 'interruption' && lastOutput.interruptionMessage) {
      lastOutputText = lastOutput.interruptionMessage;
    } else if (lastOutput.type === 'plan_exit' && lastOutput.planPreamble) {
      lastOutputText = lastOutput.planPreamble;
    } else if (lastOutput.type === 'ongoing') {
      lastOutputText = '…';
    }
  }

  const outputPreview = truncate(lastOutputText.replace(/\n/g, ' '), LAST_OUTPUT_PREVIEW_MAX);
  const outputTruncated = lastOutputText.length > LAST_OUTPUT_PREVIEW_MAX;

  return (
    <div className="py-1.5">
      {/* Header line */}
      <div className="flex items-baseline gap-2" style={{ color: 'var(--color-text-muted)' }}>
        <span>├─</span>
        <span>[{timeStr}]</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>Claude</span>
        <span>·</span>
        <span>{modelName}</span>
        <span>·</span>
        <span>{durStr}</span>
        <span>·</span>
        <span>{tokStr} tok</span>
      </div>

      {/* Items summary + expand toggle */}
      <div className="pl-4 mt-0.5 flex items-baseline gap-2" style={{ color: 'var(--color-text-muted)' }}>
        <span>│</span>
        <span>{itemsSummary || 'no items'}</span>
        {displayItems.length > 0 && (
          <button
            onClick={() => setIsExpanded((v) => !v)}
            style={{ color: 'var(--color-text-muted)' }}
          >
            {isExpanded ? '[-]' : '[+]'}
          </button>
        )}
      </div>

      {/* Expanded display items */}
      {isExpanded && displayItems.length > 0 && (
        <div className="pl-4 mt-0.5">
          <div style={{ color: 'var(--color-text-muted)' }}>│</div>
          {displayItems.map((item, i) => (
            <TerminalDisplayItem key={i} item={item} isLast={i === displayItems.length - 1} />
          ))}
        </div>
      )}

      {/* Last output (the "answer") */}
      {lastOutputText && (
        <div className="pl-4 mt-0.5 flex items-baseline gap-2">
          <span style={{ color: 'var(--color-text-muted)' }}>│</span>
          <span className="break-words" style={{ color: 'var(--color-text)' }}>
            {isOutputExpanded ? lastOutputText : outputPreview}
          </span>
          {outputTruncated && (
            <button
              onClick={() => setIsOutputExpanded((v) => !v)}
              className="shrink-0"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {isOutputExpanded ? '[-]' : '[+]'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
