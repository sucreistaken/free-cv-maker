declare global {
  interface Window {
    /** Print mode: false until the posted CV is rendered and paginated, then true. */
    __NEXTCV_READY__?: boolean;
    /** Print mode: set when rendering cannot finish, so a headless caller stops waiting (e.g. "no-root"). */
    __NEXTCV_ERROR__?: string;
  }
}

/** Marks the print as failed; the ready flag then never turns true for this load. */
export function markPrintError(code: string, detail?: unknown): void {
  console.error(`[NextCV print] ${code}`, detail ?? '');
  window.__NEXTCV_ERROR__ = code;
}

/** A new load starts clean: not ready, no error. */
export function resetPrintStatus(): void {
  window.__NEXTCV_READY__ = false;
  delete window.__NEXTCV_ERROR__;
}
