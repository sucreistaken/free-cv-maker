import { GripVertical, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface EntryCardProps {
  title: string;
  subtitle?: string;
  onRemove: () => void;
  children: React.ReactNode;
  dragHandleProps?: Record<string, unknown>;
}

export function EntryCard({ title, subtitle, onRemove, children, dragHandleProps }: EntryCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
        <button type="button" className="cursor-grab text-gray-400 hover:text-gray-600" aria-label={t('entryCard.reorder')} {...dragHandleProps}>
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0" onClick={() => setExpanded(!expanded)}>
          <p className="text-sm font-medium text-gray-800 truncate cursor-pointer">
            {title || t('entryCard.untitled')}
          </p>
          {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label={expanded ? t('entryCard.collapse') : t('entryCard.expand')}
          className="text-gray-400 hover:text-gray-600"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <button type="button" onClick={onRemove} aria-label={t('entryCard.remove')} title={t('entryCard.remove')} className="text-gray-400 hover:text-red-500">
          <Trash2 size={14} />
        </button>
      </div>
      {expanded && <div className="p-3 space-y-2">{children}</div>}
    </div>
  );
}
