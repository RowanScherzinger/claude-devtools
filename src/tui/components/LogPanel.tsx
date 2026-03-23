import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ServiceContext } from '@main/services/infrastructure/ServiceContext';
import { theme } from '../theme';
import {
  isAIChunk,
  isCompactChunk,
  isSystemChunk,
  isUserChunk,
  type EnhancedAIChunk,
  type EnhancedChunk,
  type SemanticStep,
} from '@main/types/chunks';
import {
  formatDurationShort,
  formatTime,
  formatTokensShort,
  truncate,
} from '@renderer/components/chat/terminal/terminalFormatters';
import { getToolSummary } from '@renderer/utils/toolRendering/toolSummaryHelpers';
import { useSessionLog } from '../hooks/useSessionLog';

interface Props {
  context: ServiceContext;
  projectId: string | null;
  sessionId: string | null;
  isFocused: boolean;
  height: number;
}

// ---------------------------------------------------------------------------
// Nav item types — flat list of everything navigable
// ---------------------------------------------------------------------------

type ChunkNavItem = { kind: 'chunk'; chunk: EnhancedChunk };
type StepNavItem = {
  kind: 'step';
  chunkId: string;
  step: SemanticStep;
  isLast: boolean;
  /** Resolved from the matching tool_result step (id = toolUseId) */
  resultContent?: string;
  isError?: boolean;
  tokenCount?: number;
};
type NavItem = ChunkNavItem | StepNavItem;

/** Relevant step types for navigation/expansion */
function isNavStep(s: SemanticStep): boolean {
  return s.type === 'tool_call' || s.type === 'thinking' || s.type === 'output';
}

function buildNavItems(chunks: EnhancedChunk[], expandedChunkIds: Set<string>): NavItem[] {
  const items: NavItem[] = [];
  for (const chunk of chunks) {
    items.push({ kind: 'chunk', chunk });
    if (expandedChunkIds.has(chunk.id) && isAIChunk(chunk)) {
      const allSteps = (chunk as EnhancedAIChunk).semanticSteps ?? [];

      // tool_call.id === tool_result.id (both equal the tool_use block ID / toolUseId)
      const resultByToolUseId = new Map<string, SemanticStep>();
      for (const s of allSteps) {
        if (s.type === 'tool_result') resultByToolUseId.set(s.id, s);
      }

      const navSteps = allSteps.filter(isNavStep);
      navSteps.forEach((step, i) => {
        const result = step.type === 'tool_call' ? resultByToolUseId.get(step.id) : undefined;
        items.push({
          kind: 'step',
          chunkId: chunk.id,
          step,
          isLast: i === navSteps.length - 1,
          resultContent: result?.content.toolResultContent,
          isError: result?.content.isError,
          tokenCount: result?.content.tokenCount,
        });
      });
    }
  }
  return items;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shortModel(model: string | undefined): string {
  if (!model) return 'AI';
  if (model.includes('opus')) return 'opus';
  if (model.includes('sonnet')) return 'sonnet';
  if (model.includes('haiku')) return 'haiku';
  return truncate(model, 10);
}

/** Indented content lines with a gutter bar. */
function ResultLines({
  content,
  maxLines = 10,
  maxWidth = 74,
}: {
  content: string;
  maxLines?: number;
  maxWidth?: number;
}) {
  const lines = content.split('\n');
  const shown = lines.slice(0, maxLines);
  const remaining = lines.length - shown.length;
  return (
    <>
      {shown.map((line, i) => (
        <Box key={i}>
          <Text dimColor>{`   ${theme.chars.gutter}  `}</Text>
          <Text dimColor>{truncate(line, maxWidth)}</Text>
        </Box>
      ))}
      {remaining > 0 && (
        <Box>
          <Text dimColor>{`   ${theme.chars.gutter}  …(+${remaining} lines)`}</Text>
        </Box>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Chunk header row (collapsed or just showing header when expanded)
// ---------------------------------------------------------------------------

function ChunkHeader({
  chunk,
  isCursor,
  isExpanded,
}: {
  chunk: EnhancedChunk;
  isCursor: boolean;
  isExpanded: boolean;
}) {
  const time = formatTime(chunk.startTime);
  const prefix = isCursor ? theme.chars.cursor : theme.chars.noCursor;
  const color = isCursor ? theme.colors.cursor : undefined;

  if (isUserChunk(chunk)) {
    const content = chunk.userMessage.content;
    const fullText = typeof content === 'string' ? content : '[attachment]';
    return (
      <Box flexDirection="column">
        <Box>
          <Text color={color}>{prefix}</Text>
          <Text color={theme.colors.userLabel}>{`[${time}] `}</Text>
          <Text bold color={theme.colors.userLabel}>USER: </Text>
          <Text color={color}>{isExpanded ? '' : truncate(fullText, 75)}</Text>
        </Box>
        {isExpanded && <ResultLines content={fullText} maxLines={20} />}
      </Box>
    );
  }

  if (isAIChunk(chunk)) {
    const model = chunk.responses.find((r) => r.model)?.model;
    const dur = formatDurationShort(chunk.durationMs);
    const tok = formatTokensShort(chunk.metrics.totalTokens);
    const hint = isExpanded ? ' [↵ collapse]' : ' [↵ expand]';
    return (
      <Box>
        <Text color={color}>{prefix}</Text>
        <Text color={theme.colors.aiLabel}>{`[${time}] `}</Text>
        <Text bold color={theme.colors.aiLabel}>AI </Text>
        <Text dimColor>{`(${shortModel(model)}, ${dur}, ${tok})`}</Text>
        <Text dimColor>{hint}</Text>
      </Box>
    );
  }

  if (isSystemChunk(chunk)) {
    return (
      <Box flexDirection="column">
        <Box>
          <Text color={color}>{prefix}</Text>
          <Text dimColor>{`[${time}] $ `}</Text>
          <Text dimColor>
            {isExpanded ? '' : truncate(chunk.commandOutput.replace(/\n/g, ' '), 72)}
          </Text>
        </Box>
        {isExpanded && <ResultLines content={chunk.commandOutput} maxLines={20} />}
      </Box>
    );
  }

  if (isCompactChunk(chunk)) {
    return (
      <Box>
        <Text color={color}>{prefix}</Text>
        <Text dimColor>{theme.chars.separator.repeat(10) + ' COMPACTED ' + theme.chars.separator.repeat(10)}</Text>
      </Box>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Individual step row (a tool call, thinking, or output step)
// ---------------------------------------------------------------------------

function StepRow({
  step,
  isLast,
  isCursor,
  isExpanded,
  resultContent,
  isError,
  tokenCount,
}: {
  step: SemanticStep;
  isLast: boolean;
  isCursor: boolean;
  isExpanded: boolean;
  resultContent?: string;
  isError?: boolean;
  tokenCount?: number;
}) {
  const branch = isLast ? theme.chars.treeEnd : theme.chars.treeBranch;
  const color = isCursor ? theme.colors.cursor : undefined;
  const prefix = isCursor ? theme.chars.cursor[0] : ' ';

  if (step.type === 'tool_call') {
    const toolName = step.content.toolName ?? 'tool';
    const toolInput = (step.content.toolInput ?? {}) as Record<string, unknown>;
    const summary = getToolSummary(toolName, toolInput);
    const detail = summary !== toolName ? ` · ${truncate(summary, 50)}` : '';
    const statusStr =
      resultContent !== undefined
        ? isError
          ? ' [err]'
          : ` [ok${tokenCount ? ` ${formatTokensShort(tokenCount)}tok` : ''}]`
        : '';

    return (
      <Box flexDirection="column">
        <Box>
          <Text color={color}>{prefix}</Text>
          <Text dimColor>{` ${branch} `}</Text>
          <Text color={color}>{toolName}</Text>
          {detail ? <Text dimColor>{detail}</Text> : null}
          {statusStr ? (
            <Text color={isError ? theme.colors.toolError : theme.colors.toolSuccess}>{statusStr}</Text>
          ) : null}
          {isCursor && !isExpanded && resultContent ? (
            <Text dimColor>{' [↵ expand]'}</Text>
          ) : null}
          {isCursor && isExpanded ? (
            <Text dimColor>{' [↵ collapse]'}</Text>
          ) : null}
        </Box>
        {isExpanded && resultContent ? (
          <ResultLines content={resultContent} />
        ) : null}
      </Box>
    );
  }

  if (step.type === 'thinking') {
    const tokStr = step.content.tokenCount
      ? ` (${formatTokensShort(step.content.tokenCount)}tok)`
      : '';
    const hint = isCursor
      ? isExpanded
        ? ' [↵ collapse]'
        : ' [↵ expand]'
      : '';
    return (
      <Box flexDirection="column">
        <Box>
          <Text color={color}>{prefix}</Text>
          <Text dimColor>{` ${branch} `}</Text>
          <Text dimColor color={color}>
            think{tokStr}
          </Text>
          {hint ? <Text dimColor>{hint}</Text> : null}
        </Box>
        {isExpanded && step.content.thinkingText ? (
          <ResultLines content={step.content.thinkingText} maxLines={12} />
        ) : null}
      </Box>
    );
  }

  if (step.type === 'output') {
    const fullText = step.content.outputText ?? '';
    const hint = isCursor
      ? isExpanded
        ? ' [↵ collapse]'
        : ' [↵ expand]'
      : '';
    return (
      <Box flexDirection="column">
        <Box>
          <Text color={color}>{prefix}</Text>
          <Text dimColor>{` ${branch} `}</Text>
          <Text dimColor color={color}>
            {isExpanded ? 'output:' : truncate(fullText.replace(/\n/g, ' '), 65)}
          </Text>
          {hint ? <Text dimColor>{hint}</Text> : null}
        </Box>
        {isExpanded && fullText ? (
          <ResultLines content={fullText} maxLines={20} />
        ) : null}
      </Box>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// LogPanel
// ---------------------------------------------------------------------------

export function LogPanel({ context, projectId, sessionId, isFocused, height }: Props) {
  const { chunks, loading, isLive } = useSessionLog(context, projectId, sessionId);

  const [cursorNavIdx, setCursorNavIdx] = useState(0);
  const [topNavIdx, setTopNavIdx] = useState(0);
  const [expandedChunkIds, setExpandedChunkIds] = useState<Set<string>>(new Set());
  const [expandedStepIds, setExpandedStepIds] = useState<Set<string>>(new Set());

  // Reset when session changes
  useEffect(() => {
    setCursorNavIdx(0);
    setTopNavIdx(0);
    setExpandedChunkIds(new Set());
    setExpandedStepIds(new Set());
  }, [sessionId]);

  // Follow new chunks when at the bottom
  const totalChunks = chunks.length;
  useEffect(() => {
    if (totalChunks === 0) return;
    // Only auto-advance if cursor was on the last chunk
    setCursorNavIdx((prev) => {
      const navItems = buildNavItems(chunks, expandedChunkIds);
      if (prev >= navItems.length - 2) return navItems.length - 1;
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalChunks]);

  const navItems = buildNavItems(chunks, expandedChunkIds);
  const totalNav = navItems.length;

  const borderColor = isFocused ? theme.colors.focusedBorder : theme.colors.unfocusedBorder;
  const innerHeight = height - 3;
  const avgLinesPerItem = 2;
  const visibleCount = Math.max(1, Math.floor(innerHeight / avgLinesPerItem));
  const pageSize = Math.floor(visibleCount / 2);

  // Derive visible window: keep cursor within [topNavIdx, topNavIdx + visibleCount)
  const safeCursor = Math.min(cursorNavIdx, Math.max(0, totalNav - 1));
  const safeTop = Math.max(
    0,
    Math.min(
      topNavIdx,
      safeCursor,
      Math.max(0, totalNav - visibleCount)
    )
  );
  const finalTop =
    safeCursor >= safeTop + visibleCount ? safeCursor - visibleCount + 1 : safeTop;
  const startNav = Math.max(0, finalTop);
  const endNav = Math.min(totalNav, startNav + visibleCount);
  const visibleItems = navItems.slice(startNav, endNav);

  useInput(
    (_input, key) => {
      const moveCursor = (delta: number) => {
        setCursorNavIdx((prev) => {
          const next = Math.max(0, Math.min(totalNav - 1, prev + delta));
          setTopNavIdx((top) => {
            if (next < top) return next;
            if (next >= top + visibleCount) return next - visibleCount + 1;
            return top;
          });
          return next;
        });
      };

      if (key.upArrow) moveCursor(-1);
      else if (key.downArrow) moveCursor(1);
      else if (key.pageUp) moveCursor(-pageSize);
      else if (key.pageDown) moveCursor(pageSize);
      else if (key.return) {
        const item = navItems[safeCursor];
        if (!item) return;
        if (item.kind === 'chunk') {
          // Toggle chunk expansion (only AI chunks expand into steps)
          if (!isAIChunk(item.chunk) && !isUserChunk(item.chunk) && !isSystemChunk(item.chunk)) return;
          setExpandedChunkIds((prev) => {
            const next = new Set(prev);
            if (next.has(item.chunk.id)) next.delete(item.chunk.id);
            else next.add(item.chunk.id);
            return next;
          });
        } else {
          // Toggle individual step expansion
          setExpandedStepIds((prev) => {
            const next = new Set(prev);
            if (next.has(item.step.id)) next.delete(item.step.id);
            else next.add(item.step.id);
            return next;
          });
        }
      }
    },
    { isActive: isFocused }
  );

  const headerColor = isLive ? theme.colors.liveHeader : isFocused ? theme.colors.focusedHeader : theme.colors.unfocusedHeader;
  const headerText = sessionId ? (isLive ? ' Log  [LIVE]' : ' Log') : ' Log';

  return (
    <Box
      flexDirection="column"
      flexGrow={1}
      borderStyle="single"
      borderColor={borderColor}
      overflow="hidden"
    >
      <Box>
        <Text bold color={headerColor}>
          {headerText}
        </Text>
        {sessionId && totalNav > 0 && (
          <Text dimColor>{`  ${safeCursor + 1}/${totalNav}`}</Text>
        )}
      </Box>

      {!sessionId && <Text dimColor>{'  ← select a session'}</Text>}
      {sessionId && loading && chunks.length === 0 && <Text dimColor>{'  Loading...'}</Text>}
      {sessionId && !loading && chunks.length === 0 && (
        <Text dimColor>{'  No messages yet'}</Text>
      )}

      {visibleItems.map((item, i) => {
        const absIdx = startNav + i;
        const isCursor = absIdx === safeCursor;
        if (item.kind === 'chunk') {
          return (
            <ChunkHeader
              key={item.chunk.id}
              chunk={item.chunk}
              isCursor={isCursor}
              isExpanded={expandedChunkIds.has(item.chunk.id)}
            />
          );
        }
        return (
          <StepRow
            key={item.step.id}
            step={item.step}
            isLast={item.isLast}
            isCursor={isCursor}
            isExpanded={expandedStepIds.has(item.step.id)}
            resultContent={item.resultContent}
            isError={item.isError}
            tokenCount={item.tokenCount}
          />
        );
      })}

      {sessionId && totalChunks > 0 && (
        <Box marginTop={1}>
          <Text dimColor>
            {`  tok: ${formatTokensShort(chunks.reduce((s, c) => s + c.metrics.totalTokens, 0))}`}
            {`  dur: ${formatDurationShort(chunks.reduce((s, c) => s + c.durationMs, 0))}`}
            {'  [↵] expand/collapse'}
          </Text>
        </Box>
      )}
    </Box>
  );
}
