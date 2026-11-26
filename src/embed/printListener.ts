import { readLoadMessage } from './messages';
import { allowedOrigins, applyEmbeddedCV } from './embedStore';
import { resetPrintStatus } from './printStatus';

/**
 * Print mode has no parent window: the headless browser posts `a2c:load` from the
 * page itself. Attached before React renders, so a message sent right after the
 * page load is never missed; the flag turns false at the same moment. The caller
 * then waits for `__NEXTCV_READY__ === true` or a string in `__NEXTCV_ERROR__`.
 */
export function startPrintListener(): void {
  resetPrintStatus();
  window.addEventListener('message', (event) => {
    const cv = readLoadMessage(
      { origin: event.origin, data: event.data },
      { mode: 'print', allowedOrigins: allowedOrigins(), selfOrigin: window.location.origin },
    );
    if (!cv) return;
    resetPrintStatus();
    applyEmbeddedCV(cv, event.origin);
  });
}
