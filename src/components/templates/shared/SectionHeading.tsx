import type React from 'react';

interface SectionHeadingProps {
  title: string;
  className?: string;
  color?: string;
  textTransform?: React.CSSProperties['textTransform'];
}

export function SectionHeading({ title, className, color, textTransform = 'uppercase' }: SectionHeadingProps) {
  return (
    <div className={className}>
      <h2
        className="text-[13px] font-bold tracking-wider"
        style={{
          color: color || undefined,
          textTransform,
        }}
      >
        {title}
      </h2>
      <div className="border-b mt-1" style={{ borderColor: color || '#9ca3af' }} />
    </div>
  );
}
