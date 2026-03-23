/** Central theme configuration for the TUI. Edit values here to restyle all panels. */
export const theme = {
  colors: {
    /** Border color when a pane is focused */
    focusedBorder: '#b87333',
    /** Border color when a pane is unfocused */
    unfocusedBorder: 'gray',
    /** Header text color when a pane is focused */
    focusedHeader: '#c0c0c0',
    /** Header text color when a pane is unfocused */
    unfocusedHeader: '#8d8d8d',
    /** Header text color when the session is live */
    liveHeader: 'green',
    /** Color of the cursor row highlight */
    cursor: '#d4a017',
    /** Color of a selected-but-not-cursor row */
    selected: 'yellow',
    /** Dot/text color for an ongoing (live) session */
    liveIndicator: 'green',
    /** Dot color for a completed session */
    inactiveIndicator: 'gray',
    /** Timestamp / label color for user messages in the log */
    userLabel: '#a17911',
    /** Timestamp / label color for AI messages in the log */
    aiLabel: '#a30000',
    /** Status color for a successful tool result */
    toolSuccess: 'green',
    /** Status color for a failed tool result */
    toolError: 'red',
  },

  chars: {
    /** Cursor prefix string (must be 2 chars wide to keep alignment) */
    cursor: '▶ ',
    /** Placeholder when row has no cursor (same width as cursor) */
    noCursor: '  ',
    /** Dot shown next to an ongoing session */
    ongoingDot: '●',
    /** Dot shown next to a completed session */
    completedDot: '○',
    /** Tree branch character for a non-final child row */
    treeBranch: '├─',
    /** Tree branch character for the final child row */
    treeEnd: '└─',
    /** Vertical gutter bar for indented content */
    gutter: '│',
    /** Character repeated to draw horizontal separators */
    separator: '─',
  },

  layout: {
    /** Fixed width (in terminal columns) of the Projects panel */
    projectPanelWidth: 28,
    /** Fixed width (in terminal columns) of the Sessions panel */
    sessionPanelWidth: 34,
  },
} as const;
