import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Eye, EyeOff, GripVertical } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useEditorFocusStore } from '../../store/useEditorFocusStore';

interface SectionAccordionProps {
  title: string;
  visible: boolean;
  onToggleVisibility: () => void;
  children: React.ReactNode;
  dragHandleProps?: Record<string, unknown>;
  defaultOpen?: boolean;
  sectionId?: string;
}

export function SectionAccordion({
  title,
  visible,
  onToggleVisibility,
  children,
  dragHandleProps,
  defaultOpen = false,
  sectionId,
}: SectionAccordionProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);
  const rootRef = useRef<HTMLDivElement>(null);
  const focusTarget = useEditorFocusStore((s) => s.target);

  // A click on the preview asks the matching section to open and scroll into view.
  useEffect(() => {
    if (!sectionId || focusTarget?.sectionId !== sectionId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to an external focus request
    setOpen(true);
    // Wait a frame so the panel is visible (mobile) and expanded before scrolling.
    const frame = requestAnimationFrame(() => {
      rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [focusTarget, sectionId]);

  return (
    <div ref={rootRef} className={cn('border border-gray-200 rounded-lg bg-white', !visible && 'opacity-60')}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button type="button" className="cursor-grab text-gray-400 hover:text-gray-600" {...dragHandleProps}>
          <GripVertical size={16} />
        </button>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex-1 flex items-center gap-2 text-left"
        >
          <ChevronDown
            size={16}
            className={cn(
              'text-gray-400 transition-transform',
              open && 'rotate-180'
            )}
          />
          <span className="text-sm font-semibold text-gray-800">{title}</span>
        </button>
        <button
          type="button"
          onClick={onToggleVisibility}
          className="text-gray-400 hover:text-gray-600 p-0.5"
          aria-label={visible ? t('sectionAccordion.hideSection') : t('sectionAccordion.showSection')}
          title={visible ? t('sectionAccordion.hideSection') : t('sectionAccordion.showSection')}
        >
          {visible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      </div>
      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}
