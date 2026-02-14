import { useCVStore } from '../../../store/useCVStore';
import { useTemplateTheme } from '../../../hooks/useTemplateTheme';
import { TemplateWrapper } from '../TemplateWrapper';
import { ContactBar } from '../shared/ContactBar';

export function ClassicCoverLetter() {
  const { personalInfo, coverLetterData } = useCVStore();
  const { accentColor, photoSize, photoShape, photoVisible } = useTemplateTheme();

  return (
    <TemplateWrapper>
      {/* Header - same style as ClassicTemplate */}
      <div className="text-center mb-4">
        {personalInfo.profilePhoto && photoVisible && (
          <img src={personalInfo.profilePhoto} alt="Profile photo" className="object-cover mx-auto mb-2" style={{ width: photoSize, height: photoSize, borderRadius: photoShape }} />
        )}
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">
          {personalInfo.fullName}
        </h1>
        {personalInfo.jobTitle && (
          <p className="text-[12px] text-gray-600 mt-0.5">{personalInfo.jobTitle}</p>
        )}
        <div className="mt-1">
          <ContactBar info={personalInfo} iconColor={accentColor} />
        </div>
      </div>
      <div className="border-b border-gray-300 mb-6" />

      {/* Date */}
      <p className="text-[11px] text-gray-600 text-right mb-4">{coverLetterData.date}</p>

      {/* Recipient */}
      <div className="text-[11px] text-gray-700 mb-4 space-y-0.5">
        {coverLetterData.recipientName && <p className="font-medium">{coverLetterData.recipientName}</p>}
        {coverLetterData.recipientTitle && <p>{coverLetterData.recipientTitle}</p>}
        {coverLetterData.company && <p>{coverLetterData.company}</p>}
        {coverLetterData.address && <p>{coverLetterData.address}</p>}
      </div>

      {/* Greeting */}
      <p className="text-[11px] text-gray-800 font-medium mb-4">{coverLetterData.greeting}</p>

      {/* Body */}
      <div className="text-[10.5px] text-gray-700 leading-relaxed mb-6 whitespace-pre-line">
        {coverLetterData.body}
      </div>

      {/* Closing */}
      <div className="text-[11px] text-gray-700">
        <p>{coverLetterData.closing}</p>
        <p className="font-semibold mt-4">{coverLetterData.signature || personalInfo.fullName}</p>
      </div>
    </TemplateWrapper>
  );
}
