import React from 'react';
import { render } from 'ink';
import { setClaudeBasePathOverride } from '@main/utils/pathDecoder';
import { App } from './App';

const claudeRoot = process.argv.find((a) => a.startsWith('--claude-root='))?.split('=')[1];
if (claudeRoot) setClaudeBasePathOverride(claudeRoot);

const { unmount } = render(React.createElement(App));

process.on('SIGINT', () => {
  unmount();
  process.exit(0);
});
process.on('SIGTERM', () => {
  unmount();
  process.exit(0);
});
