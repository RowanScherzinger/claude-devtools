import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Text, useApp, useInput, useStdin, useStdout } from 'ink';
import { ServiceContext } from '@main/services/infrastructure/ServiceContext';
import { LocalFileSystemProvider } from '@main/services/infrastructure/LocalFileSystemProvider';
import { getProjectsBasePath, getTodosBasePath } from '@main/utils/pathDecoder';
import { LogPanel } from './components/LogPanel';
import { ProjectPanel } from './components/ProjectPanel';
import { SessionPanel } from './components/SessionPanel';

export function App() {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const { isRawModeSupported } = useStdin();

  const [focusedPane, setFocusedPane] = useState<0 | 1 | 2>(0);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const contextRef = useRef<ServiceContext | null>(null);
  if (!contextRef.current) {
    contextRef.current = new ServiceContext({
      id: 'tui-local',
      type: 'local',
      fsProvider: new LocalFileSystemProvider(),
      projectsDir: getProjectsBasePath(),
      todosDir: getTodosBasePath(),
    });
    contextRef.current.start();
  }
  const context = contextRef.current;

  useEffect(() => {
    return () => {
      context.dispose();
    };
  }, [context]);

  useInput(
    (input, key) => {
      if (input === 'q') {
        context.dispose();
        exit();
      }
      if (key.tab) {
        setFocusedPane((p) => (((p + 1) % 3) as 0 | 1 | 2));
      }
    },
    { isActive: isRawModeSupported }
  );

  const handleProjectSelect = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedSessionId(null);
    setFocusedPane(1);
  }, []);

  const handleSessionSelect = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId);
    setFocusedPane(2);
  }, []);

  const termHeight = stdout?.rows ?? 24;
  const panelHeight = termHeight - 1; // leave 1 line for status bar

  return (
    <Box flexDirection="column" height={termHeight}>
      <Box flexDirection="row" flexGrow={1}>
        <ProjectPanel
          context={context}
          isFocused={focusedPane === 0 && isRawModeSupported}
          selectedId={selectedProjectId}
          onSelect={handleProjectSelect}
          height={panelHeight}
        />
        <SessionPanel
          context={context}
          projectId={selectedProjectId}
          isFocused={focusedPane === 1 && isRawModeSupported}
          selectedId={selectedSessionId}
          onSelect={handleSessionSelect}
          height={panelHeight}
        />
        <LogPanel
          context={context}
          projectId={selectedProjectId}
          sessionId={selectedSessionId}
          isFocused={focusedPane === 2 && isRawModeSupported}
          height={panelHeight}
        />
      </Box>
      <Box>
        <Text dimColor>[Tab] pane  [↑↓] nav  [Enter] select  [q] quit</Text>
      </Box>
    </Box>
  );
}
