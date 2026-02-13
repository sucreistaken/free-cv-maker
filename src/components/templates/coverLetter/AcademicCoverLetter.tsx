import { MapPin, Mail, Phone, Linkedin, Globe } from 'lucide-react';
import { useCVStore } from '../../../store/useCVStore';
import { useTemplateTheme } from '../../../hooks/useTemplateTheme';

export function AcademicCoverLetter() {
  const { personalInfo, coverLetterData } = useCVStore();
  const { fontFamily, zoom, lineHeight, margin, primaryColor, accentColor, photoSize, photoShape, photoVisible } = useTemplateTheme();

  const contactItems = [
    { icon: Mail, value: personalInfo.email },
    { icon: Phone, value: personalInfo.phone },
    { icon: MapPin, value: personalInfo.location },
    { icon: Linkedin, value: personalInfo.linkedin },
    { icon: Globe, value: personalInfo.website },
  ].filter((item) => item.value);

  return (
    <div
      className="a4-page"
      style={{
        fontFamily,
        zoom,
        lineHeight,
        paddingLeft: margin,
        paddingRight: margin,
        paddingTop: '40px',
        paddingBottom: '40px',
      }}
    >
      {/* Header */}
      <div className="text-center mb-4">
        {personalInfo.profilePhoto && photoVisible && (
          <img src={personalInfo.profilePhoto} alt="" className="object-cover mx-auto mb-2" style={{ width: photoSize, height: photoSize, borderRadius: photoShape }} />
        )}
        <h1 className="text-[22px] font-bold" style={{ color: primaryColor }}>
          {personalInfo.fullName}
        </h1>
        {personalInfo.jobTitle && (
          <p className="text-[11px] text-gray-500 mt-0.5 italic">{personalInfo.jobTitle}</p>
        )}
        <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
          {contactItems.map((item, i) => (
            <span key={i} className="flex items-center gap-1 text-[9px] text-gray-500">
              <item.icon size={9} />
              {item.value}
            </span>
          ))}
        </div>
      </div>

      <div className="border-b mb-6" style={{ borderColor: accentColor + '40' }} />

      {/* Date */}
      <p className="text-[10.5px] text-gray-600 text-right mb-6">{coverLetterData.date}</p>

      {/* Recipient */}
      <div className="text-[10.5px] text-gray-700 mb-4 space-y-0.5">
        {coverLetterData.recipientName && <p className="font-semibold">{coverLetterData.recipientName}</p>}
        {coverLetterData.recipientTitle && <p>{coverLetterData.recipientTitle}</p>}
        {coverLetterData.company && <p>{coverLetterData.company}</p>}
        {coverLetterData.address && <p>{coverLetterData.address}</p>}
      </div>

      {/* Greeting */}
      <p className="text-[10.5px] text-gray-800 mb-4">{coverLetterData.greeting}</p>

      {/* Body */}
      <div className="text-[10.5px] text-gray-700 leading-relaxed mb-8 whitespace-pre-line">
        {coverLetterData.body}
      </div>

      {/* Closing */}
      <div className="text-[10.5px] text-gray-700">
        <p>{coverLetterData.closing}</p>
        <p className="font-semibold mt-4">{coverLetterData.signature || personalInfo.fullName}</p>
      </div>
    </div>
  );
}
