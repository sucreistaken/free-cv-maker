/**
 * Works out where a printed CV will break between pages, from the laid-out DOM.
 *
 * The preview draws its page-break lines from this, and the PDF export forces
 * its breaks at the same spots, so what the preview shows is what gets printed.
 *
 * Rules (mirroring the print CSS):
 *  - an entry (`.break-inside-avoid`) never splits; it moves to the next page whole;
 *  - a section heading never ends a page; it moves down with its first entry;
 *  - any other text breaks between lines;
 *  - every page keeps the template's top and bottom padding
 *    (the print view uses `box-decoration-break: clone`).
 */

/** A4 at 96 dpi, in CSS px. */
const A4_WIDTH_PX = (210 / 25.4) * 96;
const A4_HEIGHT_PX = (297 / 25.4) * 96;
/** Safety cap so a bad measurement can never loop forever. */
const MAX_PAGES = 50;

export interface PageBreak {
  /** Distance from the top of the page element, in unscaled layout px. */
  y: number;
  /** Element that starts the next page, or null when the break falls between lines of text. */
  element: HTMLElement | null;
}

interface Unit {
  top: number;
  bottom: number;
  element: HTMLElement | null;
  heading: boolean;
}

function collectUnits(page: HTMLElement, originTop: number, scale: number): Unit[] {
  const units: Unit[] = [];
  const blocks = new Set<HTMLElement>();
  const doc = page.ownerDocument;
  const walker = doc.createTreeWalker(page, NodeFilter.SHOW_TEXT);
  const range = doc.createRange();

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim()) continue;
    const parent = node.parentElement;
    if (!parent) continue;

    const headingTitle = parent.closest('h2');
    const heading = headingTitle && page.contains(headingTitle) ? headingTitle.parentElement : null;
    const entry = parent.closest<HTMLElement>('.break-inside-avoid');
    const block = heading ?? (entry && page.contains(entry) ? entry : null);

    if (block) {
      if (blocks.has(block)) continue;
      blocks.add(block);
      const r = block.getBoundingClientRect();
      units.push({
        top: (r.top - originTop) / scale,
        bottom: (r.bottom - originTop) / scale,
        element: block,
        heading: block === heading,
      });
      continue;
    }

    range.selectNodeContents(node);
    for (const r of range.getClientRects()) {
      if (r.height === 0) continue;
      units.push({
        top: (r.top - originTop) / scale,
        bottom: (r.bottom - originTop) / scale,
        element: null,
        heading: false,
      });
    }
  }

  return units.sort((a, b) => a.top - b.top || a.bottom - b.bottom);
}

/**
 * @param page  the `.a4-page` element
 * @param scale any CSS transform scale applied around the page (the preview zoom), 1 for print
 */
export function computePageBreaks(page: HTMLElement, scale = 1): PageBreak[] {
  const view = page.ownerDocument.defaultView;
  if (!view) return [];
  const rect = page.getBoundingClientRect();
  const style = view.getComputedStyle(page);
  const zoom = parseFloat(style.zoom) || 1;
  const padTop = (parseFloat(style.paddingTop) || 0) * zoom;
  const padBottom = (parseFloat(style.paddingBottom) || 0) * zoom;

  // Content wider than the paper is shrunk to fit by the browser, which makes
  // each printed page cover proportionally more layout height.
  const width = rect.width / scale;
  const pageHeight = A4_HEIGHT_PX * Math.max(1, width / A4_WIDTH_PX);

  if (!(scale > 0) || !Number.isFinite(pageHeight) || pageHeight <= padTop + padBottom) return [];
  const units = collectUnits(page, rect.top, scale).filter((u) => Number.isFinite(u.top) && Number.isFinite(u.bottom));
  const breaks: PageBreak[] = [];
  let contentTop = padTop;
  let limit = pageHeight - padBottom;

  for (let i = 0; i < units.length && breaks.length < MAX_PAGES; i++) {
    const unit = units[i];
    if (unit.top < contentTop - 0.5 || unit.bottom <= limit + 0.5) continue;

    // Pull a heading sitting right above the overflowing unit onto the next page with it.
    let first = i;
    while (first > 0 && units[first - 1].heading && units[first - 1].top > contentTop + 0.5) first--;

    let y = units[first].top;
    let element = units[first].element;
    if (y <= contentTop + 0.5) {
      // Taller than a whole page: nothing to move, it has to split at the page edge.
      y = limit;
      element = null;
    } else {
      i = first - 1;
    }

    breaks.push({ y, element });
    contentTop = y;
    limit = y - padTop + pageHeight - padBottom;
  }

  return breaks;
}
