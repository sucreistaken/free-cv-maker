import { useEffect, useRef } from 'react';
import { CVDocument } from '../components/preview/CVDocument';
import { computePageBreaks } from '../utils/pagination';
import { useEmbedStore } from './embedStore';
import { markPrintError } from './printStatus';

const ASSET_TIMEOUT_MS = 8000;

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/** Fonts and images of the CV, capped so a stalled asset never blocks the PDF forever. */
async function waitForAssets(root: HTMLElement): Promise<void> {
  const fonts = document.fonts
    ? Promise.all([
        document.fonts.load("400 11px 'Open Sans'"),
        document.fonts.load("700 11px 'Open Sans'"),
        document.fonts.load("italic 400 11px 'Open Sans'"),
      ]).then(() => document.fonts.ready)
    : Promise.resolve();
  const images = Array.from(root.querySelectorAll('img')).map((img) =>
    img.complete
      ? Promise.resolve()
      : new Promise<void>((resolve) => {
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        }),
  );
  const cap = new Promise<void>((resolve) => setTimeout(resolve, ASSET_TIMEOUT_MS));
  await Promise.race([Promise.all([fonts.catch(() => undefined), ...images]), cap]);
}

/**
 * `/?embed=a2c&print=1`: only the CV pages, for Chrome's `page.pdf`. After each
 * `a2c:load` it waits for fonts and images, forces the same page breaks the
 * editor preview shows, then sets `window.__NEXTCV_READY__ = true`. If it cannot
 * finish, `window.__NEXTCV_ERROR__` is set instead, so a headless caller should
 * wait for either flag.
 */
export function PrintApp() {
  const loaded = useEmbedStore((s) => s.loaded);
  const version = useEmbedStore((s) => s.version);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    (async () => {
      try {
        await nextFrame();
        if (cancelled) return;
        const root = ref.current;
        if (!root) {
          markPrintError('no-root');
          return;
        }
        await waitForAssets(root);
        await nextFrame();
        if (cancelled) return;
        const page = root.querySelector<HTMLElement>('.a4-page');
        if (page) {
          page.querySelectorAll<HTMLElement>('[data-forced-break]').forEach((el) => {
            el.style.breakBefore = '';
            el.removeAttribute('data-forced-break');
          });
          for (const { element } of computePageBreaks(page)) {
            if (!element) continue;
            element.style.breakBefore = 'page';
            element.setAttribute('data-forced-break', '');
          }
        }
        window.__NEXTCV_READY__ = true;
      } catch (err) {
        if (!cancelled) markPrintError('render-failed', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loaded, version]);

  // Always render an element: index.html treats an empty #root after 4 s as a failed load.
  if (!loaded) return <div data-nextcv-print="waiting" />;
  return <CVDocument ref={ref} />;
}
