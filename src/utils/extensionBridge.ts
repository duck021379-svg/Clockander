/**
 * Chrome Extension & Embedded Context Bridge
 * Safely handles communication between Clockander widget and Chrome extension contexts,
 * handling cases where background is unreachable, content scripts are missing,
 * or extension context is invalidated.
 */

declare const chrome: any;

export function initExtensionBridge(): void {
  if (typeof window === 'undefined') return;

  // 1. Wrap communication to handle cases where background is unreachable or not present
  try {
    if (typeof chrome !== 'undefined' && chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ action: 'notify_load' }, (response: any) => {
        if (chrome.runtime?.lastError) {
          // Silence or softly warn if receiving end doesn't exist (e.g. extension updating or standalone tab)
          console.warn('Background connection check: ', chrome.runtime.lastError.message);
        } else if (response) {
          console.log('Clockander connected to extension runtime:', response);
        }
      });
    }
  } catch (e) {
    console.warn('Extension context unavailable or invalidated.', e);
  }

  // 2. Ensure listener exists to receive messages from extension or parent frame
  try {
    if (typeof chrome !== 'undefined' && chrome?.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: (res?: any) => void) => {
        if (message?.action === 'notify_load') {
          console.log('Load notified by content script');
          sendResponse({ status: 'success', app: 'Clockander' });
        }
        return true; // Keeps the message channel open for async responses
      });
    }
  } catch (e) {
    // Non-extension browser environment
  }

  // 3. PostMessage handler for iframe embedders (e.g., <iframe src="..." allow="geolocation">)
  window.addEventListener('message', (event) => {
    try {
      if (event.data?.type === 'CLOCKANDER_PING') {
        event.source?.postMessage({ type: 'CLOCKANDER_PONG', status: 'ready' }, { targetOrigin: '*' });
      }
    } catch {
      // ignore cross-origin postMessage errors
    }
  });
}

/**
 * Safely sends a message to a specific tab if in an extension background/popup context.
 */
export async function sendMessageToTab(tabId: number, message: any): Promise<any> {
  if (typeof chrome === 'undefined' || !chrome?.tabs) return null;

  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab?.status === 'complete') {
      const response = await chrome.tabs.sendMessage(tabId, message);
      return response;
    }
  } catch (error: any) {
    console.warn('Message failed: The tab may be loading or the content script is missing.', error?.message || error);
  }
  return null;
}
