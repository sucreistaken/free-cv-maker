import { forwardRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ClassicTemplate } from '../templates/ClassicTemplate';
import { ModernTemplate } from '../templates/ModernTemplate';
import { MinimalistTemplate } from '../templates/MinimalistTemplate';
import { CreativeTemplate } from '../templates/CreativeTemplate';
import { AcademicTemplate } from '../templates/AcademicTemplate';
import { CompactTemplate } from '../templates/CompactTemplate';
import { TwoColumnTemplate } from '../templates/TwoColumnTemplate';

export const CVDocument = forwardRef<HTMLDivElement>((_, ref) => {
  const template = useAppStore((s) => s.template);

  const renderTemplate = () => {
    switch (template) {
      case 'classic':
        return <ClassicTemplate />;
      case 'modern':
        return <ModernTemplate />;
      case 'minimalist':
        return <MinimalistTemplate />;
      case 'creative':
        return <CreativeTemplate />;
      case 'academic':
        return <AcademicTemplate />;
      case 'compact':
        return <CompactTemplate />;
      case 'twoColumn':
        return <TwoColumnTemplate />;
      default:
        return <ClassicTemplate />;
    }
  };

  return (
    <div ref={ref} className="print-area">
      {renderTemplate()}
    </div>
  );
});

CVDocument.displayName = 'CVDocument';
