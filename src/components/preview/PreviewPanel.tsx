import { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ZoomIn, ZoomOut, Scissors } from 'lucide-react';
import { CVDocument } from './CVDocument';
import { CoverLetterDocument } from './CoverLetterDocument';
import { useAppStore } from '../../store/useAppStore';
import { useCVStore } from '../../store/useCVStore';
import { useEditorFocusStore } from '../../store/useEditorFocusStore';
import { InlineEditPopover } from './InlineEditPopover';
import { buildPreviewFields, matchPreviewFields, normalizeForMatch } from '../../utils/previewFields';
import type { PreviewField } from '../../utils/previewFields';
import { computePageBreaks } from '../../utils/pagination';

interface PreviewPanelProps {
  contentRef: React.RefObject<HTMLDivElement | null>;
}

export function PreviewPanel({ contentRef }: PreviewPanelProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const [showPageBreaks, setShowPageBreaks] = useState(true);
  const [pageBreaks, setPageBreaks] = useState<number[]>([]);
  const pageCount = pageBreaks.length + 1;
  const [editing, setEditing] = useState<{ field: PreviewField; anchor: DOMRect } | null>(null);
  const activeDocument = useAppStore((s) => s.activeDocument);
  const fontSize = useAppStore((s) => s.theme.fontSize);

  /**
   * Finds the CV field behind a clicked piece of text. Walks up from the click
   * until an element's text equals a field value; duplicate values are told
   * apart by their position among the matching elements.
   */
  const findClickedField = (target: HTMLElement, root: HTMLElement) => {
    const fields = buildPreviewFields(useCVStore.getState());
    let el: HTMLElement | null = target;
    while (el && root.contains(el) && el !== root) {
      const candidates = matchPreviewFields(fields, el.textContent ?? '');
      if (candidates.length > 0) {
        const text = normalizeForMatch(el.textContent ?? '');
        // Deepest elements carrying exactly this text, in document order.
        const same = Array.from(root.querySelectorAll<HTMLElement>('*')).filter(
          (n) =>
            normalizeForMatch(n.textContent ?? '') === text &&
            !Array.from(n.children).some((c) => normalizeForMatch(c.textContent ?? '') === text),
        );
        const deepest = same.find((n) => n === el || n.contains(el!) || el!.contains(n)) ?? el;
        const index = Math.max(0, same.indexOf(deepest));
        return { field: candidates[index] ?? candidates[0], rect: el.getBoundingClientRect() };
      }
      el = el.parentElement;
    }
    return null;
  };

  // Click text in the preview to edit it in place; anything else opens the matching form.
  // A click belongs to the closest heading that precedes it in document order;
  // anything before the first section heading (name, contacts, photo) is personal info.
  const handlePreviewClick = (e: React.MouseEvent) => {
    if (activeDocument !== 'cv') return;
    const target = e.target as HTMLElement;
    const root = target.closest<HTMLElement>('.print-area');
    if (!root) return;

    const hit = findClickedField(target, root);
    if (hit) {
      setEditing({ field: hit.field, anchor: hit.rect });
      return;
    }

    const { sections } = useCVStore.getState();
    // Headings are upper-cased with the UI locale, so fold Turkish dotted/dotless i before comparing.
    const norm = (v: string) => v.trim().toLowerCase().replace(/\u0307/g, '').replace(/ı/g, 'i');

    let owner: HTMLElement | null = target.closest('h2');
    if (!owner) {
      const headings = Array.from(root.querySelectorAll<HTMLElement>('h2'));
      for (const h of headings) {
        if (h.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING) owner = h;
        else break;
      }
    }
    const section = owner
      ? sections.find((s) => norm(s.title) === norm(owner.textContent ?? ''))
      : sections.find((s) => s.type === 'personalInfo');
    if (!section) return;
    useAppStore.getState().setActiveTab('editor');
    useEditorFocusStore.getState().focusSection(section.id);
  };

  const openFormForEditing = () => {
    if (!editing) return;
    const section = useCVStore.getState().sections.find((s) => s.type === editing.field.key);
    setEditing(null);
    if (!section) return;
    useAppStore.getState().setActiveTab('editor');
    useEditorFocusStore.getState().focusSection(section.id);
  };

  // Auto-fit preview scale
  const calculateScale = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth - 48;
    const pageWidth = 794;
    const autoScale = Math.min(containerWidth / pageWidth, 1);
    setScale(autoScale);
  }, []);

  useEffect(() => {
    calculateScale();
    const observer = new ResizeObserver(calculateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [calculateScale]);

  // Page breaks measured from the laid-out content, with the same rules the PDF export uses
  useEffect(() => {
    const wrapper = pageRef.current?.querySelector('.print-area') as HTMLElement | null;
    if (!wrapper) return;

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const a4 = wrapper.querySelector('.a4-page') as HTMLElement | null;
        const host = pageRef.current;
        if (!a4 || !host) return;
        // Use the exact zoom value: deriving it from rounded element sizes is off by ~1px
        // at the page bottom, enough to disagree with the print on borderline entries.
        const offset = (a4.getBoundingClientRect().top - host.getBoundingClientRect().top) / scale;
        const next = computePageBreaks(a4, scale).map((b) => Math.round(offset + b.y));
        setPageBreaks((prev) => (prev.length === next.length && prev.every((y, i) => y === next[i]) ? prev : next));
      });
    };

    update();
    document.fonts?.ready.then(update);
    const resize = new ResizeObserver(update);
    resize.observe(wrapper);
    const mutation = new MutationObserver(update);
    mutation.observe(wrapper, { subtree: true, childList: true, characterData: true, attributes: true });
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutation.disconnect();
    };
  }, [activeDocument, fontSize, scale]);

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Toolbar */}
      <div className="flex items-center justify-center gap-2 py-2 bg-gray-100 border-b border-gray-200 shrink-0">
        <button
          onClick={() => setScale((s) => Math.max(s - 0.1, 0.3))}
          aria-label="Zoom out"
          className="p-1 rounded hover:bg-gray-200 text-gray-600"
        >
          <ZoomOut size={16} />
        </button>
        <span className="text-xs text-gray-500 w-12 text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale((s) => Math.min(s + 0.1, 1.5))}
          aria-label="Zoom in"
          className="p-1 rounded hover:bg-gray-200 text-gray-600"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={calculateScale}
          className="text-xs text-gray-500 hover:text-gray-700 ml-2 px-2 py-1 rounded hover:bg-gray-200"
        >
          {t('preview.fit')}
        </button>

        {/* Divider */}
        <div className="w-px h-4 bg-gray-300 mx-1" />

        {/* Page break toggle */}
        <button
          onClick={() => setShowPageBreaks((v) => !v)}
          className={`p-1 rounded flex items-center gap-1.5 text-xs ${showPageBreaks
            ? 'bg-blue-100 text-blue-700'
            : 'hover:bg-gray-200 text-gray-500'
            }`}
          title={t('preview.togglePageBreaks')}
        >
          <Scissors size={14} />
          {pageCount > 1 && (
            <span className="font-medium">{t('preview.pageCount', { count: pageCount })}</span>
          )}
        </button>

      </div>

      {/* Preview area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto custom-scrollbar p-6 flex justify-center"
      >
        <div
          ref={pageRef}
          onClick={handlePreviewClick}
          className={activeDocument === 'cv' ? 'preview-clickable' : undefined}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            position: 'relative',
          }}
        >
          {activeDocument === 'coverLetter' ? (
            <CoverLetterDocument ref={contentRef} />
          ) : (
            <CVDocument ref={contentRef} />
          )}

          {/* Page break lines */}
          {showPageBreaks &&
            pageBreaks.map((top, i) => {
              return (
                <div key={i} style={{ position: 'absolute', left: 0, right: 0, top, pointerEvents: 'none', zIndex: 10 }}>
                  <div style={{ height: 2, background: '#3b82f6', opacity: 0.45 }} />
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <span
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        fontSize: 10,
                        padding: '1px 10px',
                        borderRadius: '0 0 4px 4px',
                        fontWeight: 500,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {t('preview.page', { n1: i + 1, n2: i + 2 })}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
      {editing && (
        <InlineEditPopover
          key={`${editing.field.key}-${editing.field.entryId ?? ''}-${editing.field.field ?? ''}-${editing.field.bulletIndex ?? ''}`}
          field={editing.field}
          anchor={editing.anchor}
          onClose={() => setEditing(null)}
          onOpenForm={openFormForEditing}
        />
      )}
    </div>
  );
}
