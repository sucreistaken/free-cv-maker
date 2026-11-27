import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Eye, EyeOff, GripVertical, Pencil } from 'lucide-react';
import { cn } from '../../utils/cn';
import { SECTION_TITLE_MAX } from '../../utils/sections';
import { useEditorFocusStore } from '../../store/useEditorFocusStore';

interface SectionAccordionProps {
  title: string;
  visible: boolean;
  onToggleVisibility: () => void;
  children: React.ReactNode;
  dragHandleProps?: Record<string, unknown>;
  defaultOpen?: boolean;
  sectionId?: string;
  /** Saves a new name; the rename pencil is shown only when this is set. */
  onRename?: (title: string) => void;
  /** Shown as the placeholder while renaming: clearing the field restores this name. */
  stockTitle?: string;
  /** Short note under the name field while renaming (e.g. a template ignores the name). */
  renameHint?: string;
  /** Starts open with the name field selected (a section that was just added). */
  startRenaming?: boolean;
  /** Called once `startRenaming` took effect, so a later remount opens normally. */
  onStartRenamingHandled?: () => void;
}

export function SectionAccordion({
  title,
  visible,
  onToggleVisibility,
  children,
  dragHandleProps,
  defaultOpen = false,
  sectionId,
  onRename,
  stockTitle,
  renameHint,
  startRenaming = false,
  onStartRenamingHandled,
}: SectionAccordionProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen || startRenaming);
  const [renaming, setRenaming] = useState(startRenaming && Boolean(onRename));
  const [draft, setDraft] = useState(title);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

  // A section that was just added scrolls into view with its name selected, ready to type over.
  useEffect(() => {
    if (!startRenaming) return;
    const frame = requestAnimationFrame(() => {
      rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      onStartRenamingHandled?.();
    });
    return () => cancelAnimationFrame(frame);
  }, [startRenaming, onStartRenamingHandled]);

  useEffect(() => {
    if (renaming) inputRef.current?.select();
  }, [renaming]);

  // Escape unmounts the field; a blur fired on the way out must not save the draft.
  const cancelledRef = useRef(false);

  const beginRename = () => {
    cancelledRef.current = false;
    setDraft(title);
    setRenaming(true);
  };

  const commitRename = () => {
    if (!renaming || cancelledRef.current) return;
    setRenaming(false);
    if (draft !== title) onRename?.(draft);
  };

  const cancelRename = () => {
    cancelledRef.current = true;
    setRenaming(false);
    setDraft(title);
  };

  return (
    <div ref={rootRef} className={cn('border border-gray-200 rounded-lg bg-white', !visible && 'opacity-60')}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          className="cursor-grab text-gray-400 hover:text-gray-600"
          aria-label={t('entryCard.reorder')}
          {...dragHandleProps}
        >
          <GripVertical size={16} />
        </button>
        {renaming ? (
          <div className="flex-1 min-w-0">
            <input
              ref={inputRef}
              value={draft}
              maxLength={SECTION_TITLE_MAX}
              placeholder={stockTitle}
              aria-label={t('sectionAccordion.titleLabel')}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitRename();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelRename();
                }
              }}
              className="w-full text-sm font-semibold text-gray-800 border border-primary/60 rounded-md px-2 py-1 -my-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {renameHint && <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">{renameHint}</p>}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="flex-1 min-w-0 flex items-center gap-2 text-left"
          >
            <ChevronDown
              size={16}
              className={cn('shrink-0 text-gray-400 transition-transform', open && 'rotate-180')}
            />
            <span className="text-sm font-semibold text-gray-800 break-words min-w-0">{title}</span>
          </button>
        )}
        {onRename && !renaming && (
          <button
            type="button"
            onClick={beginRename}
            className="shrink-0 text-gray-400 hover:text-gray-600 p-0.5"
            aria-label={t('sectionAccordion.rename')}
            title={t('sectionAccordion.rename')}
          >
            <Pencil size={13} />
          </button>
        )}
        <button
          type="button"
          onClick={onToggleVisibility}
          className="shrink-0 text-gray-400 hover:text-gray-600 p-0.5"
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
