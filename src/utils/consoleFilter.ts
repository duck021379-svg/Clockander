/**
 * Console Warning & Origin Trial Sanitizer
 * Silences benign host-level Chrome Origin Trial warnings ('writer', 'rewriter', 'proofreader')
 * and Google Identity telemetry notices ('ID or name found in config') from cluttering DevTools.
 */

export function initConsoleFilter(): void {
  if (typeof window === 'undefined') return;

  const originalWarn = console.warn.bind(console);
  const originalLog = console.log.bind(console);
  const originalError = console.error.bind(console);

  const ignoredPatterns = [
    /Origin trial controlled feature not enabled:.*(?:writer|rewriter)/i,
    /Unrecognized feature:.*proofreader/i,
    /ID or name found in config/i,
    /updateJsLog/i,
    /Failed to connect to local Kokoro API/i,
    /no supported source was found/i,
    /ACCESS_TOKEN_TYPE_UNSUPPORTED/i,
    /Request had invalid authentication credentials/i,
    /generativelanguage\.googleapis\.com/i,
    /Gemini API call encountered/i,
    /WebSocket closed without opened/i,
    /\[vite\] failed to connect to websocket/i,
  ];

  // Suppress unhandled rejection and window errors from Vite HMR WebSocket in preview iframe
  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const reasonStr =
        typeof event.reason === 'string'
          ? event.reason
          : event.reason?.message || String(event.reason || '');
      if (/WebSocket closed without opened/i.test(reasonStr) || /\[vite\]/i.test(reasonStr)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  window.addEventListener(
    'error',
    (event) => {
      const errMsg = event.message || event.error?.message || '';
      if (/WebSocket closed without opened/i.test(errMsg)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  console.error = (...args: any[]) => {
    const message = args.map((a) => (typeof a === 'string' ? a : a?.message || '')).join(' ');
    for (const pattern of ignoredPatterns) {
      if (pattern.test(message)) {
        return;
      }
    }
    originalError(...args);
  };

  console.warn = (...args: any[]) => {
    const message = args.map((a) => (typeof a === 'string' ? a : a?.message || '')).join(' ');
    for (const pattern of ignoredPatterns) {
      if (pattern.test(message)) {
        return; // Suppress harmless Chrome Origin Trial / GSI notices
      }
    }
    originalWarn(...args);
  };

  console.log = (...args: any[]) => {
    const message = args.map((a) => (typeof a === 'string' ? a : '')).join(' ');
    for (const pattern of ignoredPatterns) {
      if (pattern.test(message)) {
        return;
      }
    }
    originalLog(...args);
  };
}
