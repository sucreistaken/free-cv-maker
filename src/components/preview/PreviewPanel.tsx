import { useRef, useState, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Scissors } from 'lucide-react';
import { CVDocument } from './CVDocument';
import { CoverLetterDocument } from './CoverLetterDocument';
import { useAppStore } from '../../store/useAppStore';

const A4_HEIGHT = 1123;

interface PreviewPanelProps {
  contentRef: React.RefObject<HTMLDivElement | null>;
}

export function PreviewPanel({ contentRef }: PreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const [showPageBreaks, setShowPageBreaks] = useState(true);
  const [pageCount, setPageCount] = useState(1);
  const activeDocument = useAppStore((s) => s.activeDocument);

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

  // Track page content height to calculate page count
  useEffect(() => {
    const el = pageRef.current?.querySelector('.a4-page') as HTMLElement | null;
    if (!el) return;

    const updatePageCount = () => {
      const height = el.scrollHeight;
      setPageCount(Math.max(1, Math.ceil(height / A4_HEIGHT)));
    };

    updatePageCount();
    const observer = new ResizeObserver(updatePageCount);
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeDocument]);

  // Build page break labels
  const breakLabels: { top: number; label: string }[] = [];
  if (showPageBreaks && pageCount > 1) {
    for (let i = 1; i < pageCount; i++) {
      breakLabels.push({
        top: i * A4_HEIGHT,
        label: `Sayfa ${i} | Sayfa ${i + 1}`,
      });
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Toolbar */}
      <div className="flex items-center justify-center gap-2 py-2 bg-gray-100 border-b border-gray-200 shrink-0">
        <button
          onClick={() => setScale((s) => Math.max(s - 0.1, 0.3))}
          className="p-1 rounded hover:bg-gray-200 text-gray-600"
        >
          <ZoomOut size={16} />
        </button>
        <span className="text-xs text-gray-500 w-12 text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale((s) => Math.min(s + 0.1, 1.5))}
          className="p-1 rounded hover:bg-gray-200 text-gray-600"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={calculateScale}
          className="text-xs text-gray-500 hover:text-gray-700 ml-2 px-2 py-1 rounded hover:bg-gray-200"
        >
          Fit
        </button>

        {/* Divider */}
        <div className="w-px h-4 bg-gray-300 mx-1" />

        {/* Page break toggle */}
        <button
          onClick={() => setShowPageBreaks((v) => !v)}
          className={`p-1 rounded flex items-center gap-1.5 text-xs ${
            showPageBreaks
              ? 'bg-blue-100 text-blue-700'
              : 'hover:bg-gray-200 text-gray-500'
          }`}
          title="Sayfa kırılımlarını göster/gizle"
        >
          <Scissors size={14} />
          {pageCount > 1 && (
            <span className="font-medium">{pageCount} sayfa</span>
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
          className={showPageBreaks ? 'show-page-breaks' : ''}
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

          {/* Page break labels */}
          {breakLabels.map((b) => (
            <div
              key={b.top}
              className="page-break-label"
              style={{ top: b.top }}
            >
              <span>{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
