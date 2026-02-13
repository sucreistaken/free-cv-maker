import { forwardRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ClassicCoverLetter } from '../templates/coverLetter/ClassicCoverLetter';
import { ModernCoverLetter } from '../templates/coverLetter/ModernCoverLetter';
import { MinimalistCoverLetter } from '../templates/coverLetter/MinimalistCoverLetter';
import { CreativeCoverLetter } from '../templates/coverLetter/CreativeCoverLetter';
import { AcademicCoverLetter } from '../templates/coverLetter/AcademicCoverLetter';
import { CompactCoverLetter } from '../templates/coverLetter/CompactCoverLetter';
import { TwoColumnCoverLetter } from '../templates/coverLetter/TwoColumnCoverLetter';

export const CoverLetterDocument = forwardRef<HTMLDivElement>((_, ref) => {
  const template = useAppStore((s) => s.template);

  const renderTemplate = () => {
    switch (template) {
      case 'classic':
        return <ClassicCoverLetter />;
      case 'modern':
        return <ModernCoverLetter />;
      case 'minimalist':
        return <MinimalistCoverLetter />;
      case 'creative':
        return <CreativeCoverLetter />;
      case 'academic':
        return <AcademicCoverLetter />;
      case 'compact':
        return <CompactCoverLetter />;
      case 'twoColumn':
        return <TwoColumnCoverLetter />;
      default:
        return <ClassicCoverLetter />;
    }
  };

  return (
    <div ref={ref} className="print-area">
      {renderTemplate()}
    </div>
  );
});

CoverLetterDocument.displayName = 'CoverLetterDocument';
