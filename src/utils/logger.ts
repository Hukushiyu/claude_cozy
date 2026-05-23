/**
 * Timestamped logger for performance debugging
 */

const APP_START_TIME = performance.now();

export function logWithTimestamp(message: string, ...args: any[]) {
  const elapsed = (performance.now() - APP_START_TIME).toFixed(0);
  console.log(`[+${elapsed}ms] ${message}`, ...args);
}

export function getElapsedTime(): number {
  return performance.now() - APP_START_TIME;
}
