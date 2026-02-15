import { forwardRef, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import { applyFormatting } from '../../utils/formatText';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  /** Direct value callback for formatting toolbar — bypasses synthetic events */
  onValueChange?: (value: string) => void;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, id, value, onChange, onValueChange, ...props }, ref) => {
    const { t } = useTranslation();
    const internalRef = useRef<HTMLTextAreaElement | null>(null);
    const len = typeof value === 'string' ? value.length : 0;

    const setRef = useCallback(
      (el: HTMLTextAreaElement | null) => {
        internalRef.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
      },
      [ref],
    );

    const handleFormat = useCallback(
      (marker: string) => {
        const textarea = internalRef.current;
        if (!textarea || typeof value !== 'string') return;

        const result = applyFormatting(
          value,
          textarea.selectionStart,
          textarea.selectionEnd,
          marker,
        );

        if (onValueChange) {
          onValueChange(result.newValue);
        } else if (onChange) {
          // Fallback: programmatically set native value + dispatch input event
          const nativeSetter = Object.getOwnPropertyDescriptor(
            HTMLTextAreaElement.prototype,
            'value',
          )?.set;
          if (nativeSetter) {
            nativeSetter.call(textarea, result.newValue);
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }

        requestAnimationFrame(() => {
          textarea.selectionStart = result.newStart;
          textarea.selectionEnd = result.newEnd;
          textarea.focus();
        });
      },
      [value, onChange, onValueChange],
    );

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="block text-xs font-medium text-gray-600">
            {label}
          </label>
        )}
        <div className="flex gap-0.5 mb-0.5">
          <button
            type="button"
            title={t('formatting.bold')}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleFormat('**')}
            className="px-1.5 py-0.5 text-[11px] font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            B
          </button>
          <button
            type="button"
            title={t('formatting.italic')}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleFormat('*')}
            className="px-1.5 py-0.5 text-[11px] italic text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            I
          </button>
        </div>
        <textarea
          ref={setRef}
          id={id}
          value={value}
          onChange={onChange}
          className={cn(
            'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-y min-h-[80px]',
            className,
          )}
          {...props}
        />
        {len > 0 && (
          <p className="text-[11px] text-gray-400 text-right">{len}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
