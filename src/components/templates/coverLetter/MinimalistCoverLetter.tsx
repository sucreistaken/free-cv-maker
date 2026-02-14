import { useCVStore } from '../../../store/useCVStore';
import { useTemplateTheme } from '../../../hooks/useTemplateTheme';

export function MinimalistCoverLetter() {
  const { personalInfo, coverLetterData } = useCVStore();
  const { fontFamily, zoom, effectiveA4Height, lineHeight, margin, photoSize, photoShape, photoVisible } = useTemplateTheme();

  return (
    <div
      className="a4-page"
      style={{
        fontFamily,
        zoom,
        lineHeight,
        minHeight: `${effectiveA4Height}px`,
        ['--a4-break-height' as string]: `${effectiveA4Height}px`,
        paddingLeft: margin,
        paddingRight: margin,
        paddingTop: '50px',
        paddingBottom: '50px',
      }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        {personalInfo.profilePhoto && photoVisible && (
          <img src={personalInfo.profilePhoto} alt="Profile photo" className="object-cover mx-auto mb-2" style={{ width: photoSize, height: photoSize, borderRadius: photoShape }} />
        )}
        <h1 className="text-[24px] font-normal tracking-[0.15em] text-gray-800 uppercase">
          {personalInfo.fullName}
        </h1>
        {personalInfo.jobTitle && (
          <p className="text-[11px] text-gray-500 tracking-wide mt-1">{personalInfo.jobTitle}</p>
        )}
        <div className="flex items-center justify-center gap-3 mt-2 text-[9.5px] text-gray-400">
          {personalInfo.email && <a href={`mailto:${personalInfo.email}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{personalInfo.email}</a>}
          {personalInfo.phone && <><span>·</span><a href={`tel:${personalInfo.phone}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{personalInfo.phone}</a></>}
          {personalInfo.location && <><span>·</span><span>{personalInfo.location}</span></>}
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6" />

      {/* Date */}
      <p className="text-[10.5px] text-gray-400 text-right mb-6">{coverLetterData.date}</p>

      {/* Recipient */}
      <div className="text-[10.5px] text-gray-600 mb-6 space-y-0.5">
        {coverLetterData.recipientName && <p className="font-medium text-gray-800">{coverLetterData.recipientName}</p>}
        {coverLetterData.recipientTitle && <p>{coverLetterData.recipientTitle}</p>}
        {coverLetterData.company && <p>{coverLetterData.company}</p>}
        {coverLetterData.address && <p>{coverLetterData.address}</p>}
      </div>

      {/* Greeting */}
      <p className="text-[10.5px] text-gray-800 mb-4">{coverLetterData.greeting}</p>

      {/* Body */}
      <div className="text-[10.5px] text-gray-600 leading-relaxed mb-8 whitespace-pre-line italic">
        {coverLetterData.body}
      </div>

      {/* Closing */}
      <div className="text-[10.5px] text-gray-600">
        <p>{coverLetterData.closing}</p>
        <p className="font-semibold text-gray-800 mt-4">{coverLetterData.signature || personalInfo.fullName}</p>
      </div>
    </div>
  );
}
