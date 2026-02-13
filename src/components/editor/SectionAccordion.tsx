import { useState } from 'react';
import { ChevronDown, Eye, EyeOff, GripVertical } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SectionAccordionProps {
  title: string;
  visible: boolean;
  onToggleVisibility: () => void;
  children: React.ReactNode;
  dragHandleProps?: Record<string, unknown>;
  defaultOpen?: boolean;
}

export function SectionAccordion({
  title,
  visible,
  onToggleVisibility,
  children,
  dragHandleProps,
  defaultOpen = false,
}: SectionAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn('border border-gray-200 rounded-lg bg-white', !visible && 'opacity-60')}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button type="button" className="cursor-grab text-gray-400 hover:text-gray-600" {...dragHandleProps}>
          <GripVertical size={16} />
        </button>
        <button
          type="button"
          onClick={() => setOpen(!open)}
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
          title={visible ? 'Hide section' : 'Show section'}
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
