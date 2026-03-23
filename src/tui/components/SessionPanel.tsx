import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ServiceContext } from '@main/services/infrastructure/ServiceContext';
import { truncate } from '@renderer/components/chat/terminal/terminalFormatters';
import { useSessions } from '../hooks/useSessions';
import { theme } from '../theme';

interface Props {
  context: ServiceContext;
  projectId: string | null;
  isFocused: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  height: number;
}

function formatSessionDate(ts: number): string {
  const d = new Date(ts);
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${h}:${m}`;
}

export function SessionPanel({
  context,
  projectId,
  isFocused,
  selectedId,
  onSelect,
  height,
}: Props) {
  const { sessions, loading } = useSessions(context, projectId);
  const [cursor, setCursor] = useState(0);

  useInput(
    (_input, key) => {
      if (key.upArrow) setCursor((c) => Math.max(0, c - 1));
      if (key.downArrow) setCursor((c) => Math.min(Math.max(0, sessions.length - 1), c + 1));
      if (key.return && sessions[cursor]) onSelect(sessions[cursor].id);
    },
    { isActive: isFocused }
  );

  const borderColor = isFocused ? theme.colors.focusedBorder : theme.colors.unfocusedBorder;
  // Each session row = 2 lines (header + preview), so visible count is halved
  const innerHeight = height - 2;
  const rowHeight = 2;
  const visibleCount = Math.max(1, Math.floor(innerHeight / rowHeight));
  const start = Math.max(0, cursor - Math.floor(visibleCount / 2));
  const visible = sessions.slice(start, start + visibleCount);

  return (
    <Box
      flexDirection="column"
      width={theme.layout.sessionPanelWidth}
      borderStyle="single"
      borderColor={borderColor}
      overflow="hidden"
    >
      <Text bold color={isFocused ? theme.colors.focusedHeader : theme.colors.unfocusedHeader}>
        {' Sessions'}
      </Text>
      {!projectId && <Text dimColor>{' ← select a project'}</Text>}
      {projectId && loading && <Text dimColor>{' Loading...'}</Text>}
      {projectId && !loading && sessions.length === 0 && (
        <Text dimColor>{' No sessions'}</Text>
      )}
      {projectId &&
        !loading &&
        visible.map((session, i) => {
          const idx = start + i;
          const isCursor = idx === cursor && isFocused;
          const isSelected = session.id === selectedId;
          const color = isCursor ? theme.colors.cursor : isSelected ? theme.colors.selected : undefined;
          const dot = session.isOngoing ? theme.chars.ongoingDot : theme.chars.completedDot;
          const dotColor = session.isOngoing ? theme.colors.liveIndicator : theme.colors.inactiveIndicator;
          const date = formatSessionDate(session.createdAt);
          const preview = truncate(session.firstMessage ?? '', 26);

          return (
            <Box key={session.id} flexDirection="column">
              <Box>
                <Text color={color} bold={isCursor}>
                  {isCursor ? theme.chars.cursor : theme.chars.noCursor}
                </Text>
                <Text color={dotColor}>{dot} </Text>
                <Text color={color}>{date}</Text>
                {session.isOngoing && <Text color={theme.colors.liveIndicator}> live</Text>}
              </Box>
              {preview ? (
                <Text dimColor>{`    ${preview}`}</Text>
              ) : (
                <Text> </Text>
              )}
            </Box>
          );
        })}
    </Box>
  );
}
