import { useState, useCallback, useRef, useEffect } from 'react';

const EDITOR_MIN_WIDTH = 300;

interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

export function SplitPane({ left, right }: SplitPaneProps) {
  const [leftWidth, setLeftWidth] = useState(25);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftWidth(Math.min(Math.max(pct, 25), 75));
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <div ref={containerRef} className="flex flex-1 overflow-hidden">
      {/* The editor keeps a usable width in narrow embeds (forum.ieu.app frames the app at ~830px). */}
      <div style={{ width: `${leftWidth}%`, minWidth: EDITOR_MIN_WIDTH }} className="overflow-hidden shrink-0">
        {left}
      </div>
      <div
        onMouseDown={onMouseDown}
        className="w-1.5 bg-gray-200 hover:bg-primary/30 cursor-col-resize transition-colors shrink-0"
      />
      <div className="flex-1 min-w-0 overflow-hidden">
        {right}
      </div>
    </div>
  );
}
