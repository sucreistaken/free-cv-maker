import { MapPin, Mail, Phone, Linkedin } from 'lucide-react';
import { useCVStore } from '../../../store/useCVStore';
import { useTemplateTheme } from '../../../hooks/useTemplateTheme';

export function TwoColumnCoverLetter() {
  const { personalInfo, coverLetterData } = useCVStore();
  const { fontFamily, zoom, effectiveA4Height, lineHeight, margin, primaryColor, accentColor, photoSize, photoShape, photoVisible } = useTemplateTheme();

  return (
    <div className="a4-page" style={{ fontFamily, zoom, lineHeight, minHeight: `${effectiveA4Height}px`, ['--a4-break-height' as string]: `${effectiveA4Height}px` }}>
      {/* Header */}
      <div className="pt-8 pb-4" style={{ paddingLeft: margin, paddingRight: margin }}>
        <div className="flex items-center gap-4">
          {personalInfo.profilePhoto && photoVisible && (
            <img src={personalInfo.profilePhoto} alt="Profile photo" className="object-cover shrink-0" style={{ width: photoSize, height: photoSize, borderRadius: photoShape }} />
          )}
          <div>
            <h1 className="text-[20px] font-bold" style={{ color: primaryColor }}>{personalInfo.fullName}</h1>
            {personalInfo.jobTitle && (
              <p className="text-[11px] text-gray-500 mt-0.5">{personalInfo.jobTitle}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {personalInfo.email && (
                <a href={`mailto:${personalInfo.email}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[9px] text-gray-400 hover:underline">
                  <Mail size={9} />{personalInfo.email}
                </a>
              )}
              {personalInfo.phone && (
                <a href={`tel:${personalInfo.phone}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[9px] text-gray-400 hover:underline">
                  <Phone size={9} />{personalInfo.phone}
                </a>
              )}
              {personalInfo.location && (
                <span className="flex items-center gap-1 text-[9px] text-gray-400">
                  <MapPin size={9} />{personalInfo.location}
                </span>
              )}
              {personalInfo.linkedin && (
                <a href={personalInfo.linkedin.startsWith('http') ? personalInfo.linkedin : `https://${personalInfo.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[9px] text-gray-400 hover:underline">
                  <Linkedin size={9} />{personalInfo.linkedin}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-b" style={{ borderColor: accentColor + '30', marginLeft: margin, marginRight: margin }} />

      {/* Content */}
      <div className="py-6" style={{ paddingLeft: margin, paddingRight: margin }}>
        {/* Date */}
        <p className="text-[10.5px] text-gray-500 text-right mb-4">{coverLetterData.date}</p>

        {/* Recipient */}
        <div className="text-[10.5px] text-gray-700 mb-4 space-y-0.5">
          {coverLetterData.recipientName && <p className="font-medium">{coverLetterData.recipientName}</p>}
          {coverLetterData.recipientTitle && <p>{coverLetterData.recipientTitle}</p>}
          {coverLetterData.company && <p>{coverLetterData.company}</p>}
          {coverLetterData.address && <p>{coverLetterData.address}</p>}
        </div>

        {/* Greeting */}
        <p className="text-[10.5px] text-gray-800 font-medium mb-4">{coverLetterData.greeting}</p>

        {/* Body */}
        <div className="text-[10.5px] text-gray-700 leading-relaxed mb-6 whitespace-pre-line">
          {coverLetterData.body}
        </div>

        {/* Closing */}
        <div className="text-[10.5px] text-gray-700">
          <p>{coverLetterData.closing}</p>
          <p className="font-semibold mt-4" style={{ color: primaryColor }}>
            {coverLetterData.signature || personalInfo.fullName}
          </p>
        </div>
      </div>
    </div>
  );
}
