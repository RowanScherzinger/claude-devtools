/**
 * Shared formatting utilities for the terminal view.
 * All functions are pure and have no side effects.
 */

/**
 * Format a Date as HH:mm:ss (local time).
 */
export function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  const s = date.getSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/**
 * Format a duration in milliseconds as a short human-readable string.
 * Examples: "0.4s", "3.2s", "1m 4s"
 */
export function formatDurationShort(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const totalSeconds = ms / 1000;
  if (totalSeconds < 60) return `${totalSeconds.toFixed(1)}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}m ${seconds}s`;
}

/**
 * Format a token count as a short string.
 * Examples: "840", "12.3k", "1.2M"
 */
export function formatTokensShort(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

/**
 * Truncate a string to max characters, appending ellipsis if truncated.
 */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '…';
}
