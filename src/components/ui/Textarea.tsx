import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, id, value, ...props }, ref) => {
    const len = typeof value === 'string' ? value.length : 0;

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="block text-xs font-medium text-gray-600">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          value={value}
          className={cn(
            'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-y min-h-[80px]',
            className
          )}
          {...props}
        />
        {len > 0 && (
          <p className="text-[11px] text-gray-400 text-right">{len}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
