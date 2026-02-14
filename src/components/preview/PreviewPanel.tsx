import { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ZoomIn, ZoomOut, Scissors, Settings2 } from 'lucide-react';
import { CVDocument } from './CVDocument';
import { CoverLetterDocument } from './CoverLetterDocument';
import { useAppStore } from '../../store/useAppStore';
import { A4_HEIGHT_DEFAULT } from '../../hooks/useTemplateTheme';

interface PreviewPanelProps {
  contentRef: React.RefObject<HTMLDivElement | null>;
}

export function PreviewPanel({ contentRef }: PreviewPanelProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const [showPageBreaks, setShowPageBreaks] = useState(true);
  const [showCalibration, setShowCalibration] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const activeDocument = useAppStore((s) => s.activeDocument);
  const fontSize = useAppStore((s) => s.theme.fontSize);
  const pageBreakHeights = useAppStore((s) => s.pageBreakHeights);
  const setPageBreakHeight = useAppStore((s) => s.setPageBreakHeight);
  const a4Height = pageBreakHeights?.[fontSize] || A4_HEIGHT_DEFAULT;

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

  // Page count from content measurement
  useEffect(() => {
    const wrapper = pageRef.current?.querySelector('.print-area') as HTMLElement | null;
    if (!wrapper) return;

    const update = () => {
      const a4 = wrapper.querySelector('.a4-page') as HTMLElement | null;
      const a4H = a4 ? a4.scrollHeight : 0;
      const zoomVal = parseFloat(a4 ? getComputedStyle(a4).zoom : '1') || 1;
      const visualH = Math.round(a4H * zoomVal);
      setPageCount(Math.max(1, Math.ceil(visualH / a4Height)));
    };

    update();
    const obs = new ResizeObserver(update);
    obs.observe(wrapper);
    return () => obs.disconnect();
  }, [activeDocument, fontSize, a4Height]);

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

        {/* Calibration toggle */}
        <button
          onClick={() => setShowCalibration((v) => !v)}
          className={`p-1 rounded text-xs ${showCalibration
            ? 'bg-amber-100 text-amber-700'
            : 'hover:bg-gray-200 text-gray-400'
            }`}
          title={t('preview.calibration')}
        >
          <Settings2 size={14} />
        </button>
      </div>

      {/* Calibration panel */}
      {showCalibration && (
        <div className="flex items-center justify-center gap-4 px-4 py-1.5 bg-amber-50 border-b border-amber-200 shrink-0">
          {(['small', 'medium', 'large'] as const).map((size) => {
            const label = size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L';
            const val = pageBreakHeights?.[size] || A4_HEIGHT_DEFAULT;
            const isActive = fontSize === size;
            return (
              <div key={size} className={`flex items-center gap-1.5 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                <span className={`text-[10px] font-bold w-3 ${isActive ? 'text-amber-800' : 'text-amber-600'}`}>
                  {label}
                </span>
                <input
                  type="number"
                  min={1080}
                  max={1280}
                  value={val}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v >= 1080 && v <= 1280) setPageBreakHeight(size, v);
                  }}
                  className={`w-14 text-[11px] text-center border rounded px-1 py-0.5 font-mono ${isActive
                    ? 'border-amber-400 bg-white text-amber-900'
                    : 'border-amber-200 bg-amber-50 text-amber-600'
                    }`}
                />
              </div>
            );
          })}
          <span className="text-[10px] text-amber-500">px</span>
          <button
            onClick={() => {
              setPageBreakHeight('small', A4_HEIGHT_DEFAULT);
              setPageBreakHeight('medium', A4_HEIGHT_DEFAULT);
              setPageBreakHeight('large', A4_HEIGHT_DEFAULT);
            }}
            className="text-[10px] text-amber-600 hover:text-amber-800 underline"
          >
            {t('preview.reset')}
          </button>
        </div>
      )}

      {/* Preview area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto custom-scrollbar p-6 flex justify-center"
      >
        <div
          ref={pageRef}
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
            pageCount > 1 &&
            Array.from({ length: pageCount - 1 }, (_, i) => {
              const top = (i + 1) * a4Height;
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
    </div>
  );
}
