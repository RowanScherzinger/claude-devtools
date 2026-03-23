import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ServiceContext } from '@main/services/infrastructure/ServiceContext';
import { truncate } from '@renderer/components/chat/terminal/terminalFormatters';
import { useProjects } from '../hooks/useProjects';
import { theme } from '../theme';

interface Props {
  context: ServiceContext;
  isFocused: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  height: number;
}

export function ProjectPanel({ context, isFocused, selectedId, onSelect, height }: Props) {
  const { projects, loading } = useProjects(context);
  const [cursor, setCursor] = useState(0);

  useInput(
    (_input, key) => {
      if (key.upArrow) setCursor((c) => Math.max(0, c - 1));
      if (key.downArrow) setCursor((c) => Math.min(Math.max(0, projects.length - 1), c + 1));
      if (key.return && projects[cursor]) onSelect(projects[cursor].id);
    },
    { isActive: isFocused }
  );

  const borderColor = isFocused ? theme.colors.focusedBorder : theme.colors.unfocusedBorder;
  const innerHeight = height - 2; // subtract top/bottom border
  const start = Math.max(0, cursor - Math.floor(innerHeight / 2));
  const visible = projects.slice(start, start + innerHeight);

  return (
    <Box
      flexDirection="column"
      width={theme.layout.projectPanelWidth}
      borderStyle="single"
      borderColor={borderColor}
      overflow="hidden"
    >
      <Text bold color={isFocused ? theme.colors.focusedHeader : theme.colors.unfocusedHeader}>
        {' Projects'}
      </Text>
      {loading && <Text dimColor>{' Loading...'}</Text>}
      {!loading && projects.length === 0 && <Text dimColor>{' No projects found'}</Text>}
      {!loading &&
        visible.map((project, i) => {
          const idx = start + i;
          const isCursor = idx === cursor && isFocused;
          const isSelected = project.id === selectedId;
          const color = isCursor ? theme.colors.cursor : isSelected ? theme.colors.selected : undefined;

          return (
            <Box key={project.id}>
              <Text color={color} bold={isCursor}>
                {isCursor ? theme.chars.cursor : theme.chars.noCursor}
                {truncate(project.name, 18)}
              </Text>
              <Text dimColor>{` ${project.sessions.length}`}</Text>
            </Box>
          );
        })}
    </Box>
  );
}
