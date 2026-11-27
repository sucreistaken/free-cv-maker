import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCVStore } from '../../store/useCVStore';
import type { PreviewField } from '../../utils/previewFields';

interface InlineEditPopoverProps {
  field: PreviewField;
  /** Screen rectangle of the clicked text, used to anchor the popover. */
  anchor: DOMRect;
  onClose: () => void;
  onOpenForm: () => void;
}

const WIDTH = 360;

/** Writes `value` into the store location described by `field`. */
function writeField(field: PreviewField, value: string) {
  const store = useCVStore.getState();
  const { key, entryId, field: prop, bulletIndex } = field;

  if (key === 'summary') return store.updateSummary(value);
  if (key === 'hobbies') return store.updateHobbies(value);
  if (key === 'personalInfo') return store.updatePersonalInfo(prop as never, value);
  if (!entryId || !prop) return;

  if (key === 'custom') {
    const entry = store.sections.find((s) => s.id === field.sectionId)?.items?.find((e) => e.id === entryId);
    if (!entry || !field.sectionId) return;
    const next = bulletIndex !== undefined ? entry.bullets.map((b, i) => (i === bulletIndex ? value : b)) : value;
    return store.updateCustomEntry(field.sectionId, entryId, prop as never, next);
  }

  const list = store[key as 'experience'] as { id: string; bullets?: string[] }[];
  const entry = list.find((e) => e.id === entryId);
  if (!entry) return;
  const next = bulletIndex !== undefined ? (entry.bullets ?? []).map((b, i) => (i === bulletIndex ? value : b)) : value;

  const updaters: Record<string, (id: string, f: never, v: never) => void> = {
    experience: store.updateExperience as never,
    projects: store.updateProject as never,
    education: store.updateEducation as never,
    involvement: store.updateInvolvement as never,
    skills: store.updateSkillCategory as never,
    certifications: store.updateCertification as never,
    awards: store.updateAward as never,
    references: store.updateReference as never,
  };
  updaters[key]?.(entryId, prop as never, next as never);
}

export function InlineEditPopover({ field, anchor, onClose, onOpenForm }: InlineEditPopoverProps) {
  const { t } = useTranslation();
  const [text, setText] = useState(field.value);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [pos, setPos] = useState({ top: anchor.bottom + 8, left: anchor.left });

  // Keep the popover inside the viewport; flip above the text when there is no room below.
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const width = Math.min(WIDTH, window.innerWidth - 16);
    const height = box.offsetHeight;
    const left = Math.max(8, Math.min(anchor.left, window.innerWidth - width - 8));
    const below = anchor.bottom + 8;
    const top = below + height > window.innerHeight - 8 ? Math.max(8, anchor.top - height - 8) : below;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- position depends on the measured popover height
    setPos({ top, left });
  }, [anchor]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    // Short fields are usually replaced wholesale; long text gets the caret at the end.
    if (field.multiline) input.setSelectionRange(input.value.length, input.value.length);
    else input.select();
  }, [field.multiline]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [onClose]);

  const change = (value: string) => {
    setText(value);
    writeField(field, value);
  };

  return (
    <div
      ref={boxRef}
      role="dialog"
      aria-label={t(`sections.${field.key}`)}
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: Math.min(WIDTH, window.innerWidth - 16), zIndex: 60 }}
      className="bg-white border border-gray-200 rounded-xl shadow-2xl p-3"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-gray-500">{t(`sections.${field.key}`)}</span>
        <button type="button" onClick={onOpenForm} className="text-xs text-primary hover:underline">
          {t('preview.openForm')}
        </button>
      </div>
      <textarea
        ref={inputRef}
        value={text}
        rows={field.multiline ? 4 : 1}
        onChange={(e) => change(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (!field.multiline || e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onClose();
          }
        }}
        className="w-full resize-none border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] text-gray-400">
          {field.multiline ? t('preview.inlineHintMulti') : t('preview.inlineHint')}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark"
        >
          {t('preview.done')}
        </button>
      </div>
    </div>
  );
}
