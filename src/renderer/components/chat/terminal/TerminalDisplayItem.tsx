import { useState } from 'react';

import { getToolSummary } from '@renderer/utils/toolRendering';

import type { AIGroupDisplayItem } from '@renderer/types/groups';

import { formatDurationShort, formatTokensShort, truncate } from './terminalFormatters';

const CONTENT_PREVIEW_MAX = 200;

interface Props {
  item: AIGroupDisplayItem;
  isLast: boolean;
}

export function TerminalDisplayItem({ item, isLast }: Props) {
  const [expanded, setExpanded] = useState(false);
  const branch = isLast ? '└' : '├';

  if (item.type === 'thinking') {
    const preview = truncate(item.content.replace(/\n/g, ' '), CONTENT_PREVIEW_MAX);
    return (
      <div className="flex gap-2 pl-3" style={{ color: 'var(--color-text-muted)' }}>
        <span>{branch}</span>
        <span className="w-10 shrink-0 italic">think</span>
        <span className="break-words">{preview}</span>
        {item.tokenCount ? (
          <span className="shrink-0">({formatTokensShort(item.tokenCount)}tok)</span>
        ) : null}
      </div>
    );
  }

  if (item.type === 'tool') {
    const { tool } = item;
    const summary = getToolSummary(tool.name, tool.input);
    const hasResult = tool.result !== undefined;
    const isError = tool.result?.isError ?? false;
    const resultPreview = hasResult
      ? truncate(
          typeof tool.result!.content === 'string'
            ? tool.result!.content
            : JSON.stringify(tool.result!.content),
          CONTENT_PREVIEW_MAX
        )
      : null;
    const tokStr = tool.result?.tokenCount
      ? ` (${formatTokensShort(tool.result.tokenCount)}tok)`
      : '';
    const durStr = tool.durationMs ? ` ${formatDurationShort(tool.durationMs)}` : '';

    return (
      <div className="pl-3">
        <div className="flex gap-2">
          <span style={{ color: 'var(--color-text-muted)' }}>{branch}</span>
          <span className="w-10 shrink-0" style={{ color: 'var(--tool-item-name, var(--color-text))' }}>
            tool
          </span>
          <span style={{ color: 'var(--color-text)' }}>
            {tool.name}
            {summary ? ` · ${summary}` : ''}
            {tokStr}
          </span>
        </div>
        {hasResult && (
          <div className="pl-14 flex gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <span>→</span>
            <span>
              {isError ? (
                <span style={{ color: 'var(--color-error, #f87171)' }}>[err]</span>
              ) : (
                <span style={{ color: 'var(--color-success, #86efac)' }}>[ok]</span>
              )}
              {durStr}
            </span>
            {expanded ? (
              <>
                <span className="break-words whitespace-pre-wrap">{resultPreview}</span>
                <button onClick={() => setExpanded(false)}>[-]</button>
              </>
            ) : resultPreview ? (
              <button onClick={() => setExpanded(true)} style={{ color: 'var(--color-text-muted)' }}>
                [+]
              </button>
            ) : null}
          </div>
        )}
        {expanded && resultPreview && (
          <div className="pl-14 mt-0.5 break-words whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>
            {resultPreview}
          </div>
        )}
      </div>
    );
  }

  if (item.type === 'output') {
    const preview = truncate(item.content.replace(/\n/g, ' '), CONTENT_PREVIEW_MAX);
    const isTruncated = item.content.length > CONTENT_PREVIEW_MAX;
    return (
      <div className="pl-3">
        <div className="flex gap-2">
          <span style={{ color: 'var(--color-text-muted)' }}>{branch}</span>
          <span className="w-10 shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
            out
          </span>
          <span className="break-words" style={{ color: 'var(--color-text)' }}>
            {expanded ? item.content : preview}
          </span>
          {isTruncated && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="shrink-0"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {expanded ? '[-]' : '[+]'}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (item.type === 'subagent') {
    const { subagent } = item;
    const label = subagent.team?.memberName ?? subagent.subagentType ?? 'subagent';
    const status = subagent.isOngoing ? 'running' : 'done';
    return (
      <div className="flex gap-2 pl-3" style={{ color: 'var(--color-text-muted)' }}>
        <span>{branch}</span>
        <span className="w-10 shrink-0">agent</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
        <span>[{status}]</span>
        {subagent.durationMs ? (
          <span>{formatDurationShort(subagent.durationMs)}</span>
        ) : null}
      </div>
    );
  }

  if (item.type === 'slash') {
    return (
      <div className="flex gap-2 pl-3" style={{ color: 'var(--color-text-muted)' }}>
        <span>{branch}</span>
        <span className="w-10 shrink-0">slash</span>
        <span>/{item.slash.name}</span>
        {item.slash.args ? <span>{item.slash.args}</span> : null}
      </div>
    );
  }

  if (item.type === 'teammate_message') {
    const { teammateMessage } = item;
    return (
      <div className="flex gap-2 pl-3" style={{ color: 'var(--color-text-muted)' }}>
        <span>{branch}</span>
        <span className="w-10 shrink-0">team</span>
        <span style={{ color: teammateMessage.color || 'var(--color-text-secondary)' }}>
          {teammateMessage.teammateId}
        </span>
        <span className="break-words">{truncate(teammateMessage.summary, 120)}</span>
      </div>
    );
  }

  if (item.type === 'subagent_input') {
    const preview = truncate(item.content.replace(/\n/g, ' '), CONTENT_PREVIEW_MAX);
    return (
      <div className="flex gap-2 pl-3" style={{ color: 'var(--color-text-muted)' }}>
        <span>{branch}</span>
        <span className="w-10 shrink-0">input</span>
        <span className="break-words">{preview}</span>
      </div>
    );
  }

  if (item.type === 'compact_boundary') {
    const freed = item.tokenDelta ? Math.abs(item.tokenDelta.delta) : 0;
    const freedStr = item.tokenDelta ? ` · freed ${formatTokensShort(freed)} tok` : '';
    return (
      <div className="flex gap-2 pl-3" style={{ color: 'var(--color-text-muted)' }}>
        <span>{branch}</span>
        <span className="w-10 shrink-0">cpct</span>
        <span>
          phase {item.phaseNumber}
          {freedStr}
        </span>
      </div>
    );
  }

  return null;
}
