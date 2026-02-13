import { MapPin, Mail, Phone, Linkedin, Globe } from 'lucide-react';
import { useCVStore } from '../../../store/useCVStore';
import { useTemplateTheme } from '../../../hooks/useTemplateTheme';

export function CreativeCoverLetter() {
  const { personalInfo, coverLetterData } = useCVStore();
  const { fontFamily, zoom, lineHeight, margin, accentColor, photoSize, photoShape, photoVisible } = useTemplateTheme();

  const contactItems = [
    { icon: MapPin, value: personalInfo.location },
    { icon: Mail, value: personalInfo.email },
    { icon: Phone, value: personalInfo.phone },
    { icon: Linkedin, value: personalInfo.linkedin },
    { icon: Globe, value: personalInfo.website },
  ].filter((item) => item.value);

  return (
    <div className="a4-page" style={{ fontFamily, zoom, lineHeight }}>
      {/* Banner Header */}
      <div style={{ paddingLeft: margin, paddingRight: margin, paddingTop: '24px', paddingBottom: '24px', backgroundColor: accentColor }} className="text-white">
        <div className="flex items-center gap-4">
          {personalInfo.profilePhoto && photoVisible && (
            <img src={personalInfo.profilePhoto} alt="" className="object-cover border-2 border-white/40 shrink-0" style={{ width: photoSize, height: photoSize, borderRadius: photoShape }} />
          )}
          <div>
            <h1 className="text-[24px] font-bold">{personalInfo.fullName}</h1>
            {personalInfo.jobTitle && (
              <p className="text-[12px] opacity-85 mt-0.5">{personalInfo.jobTitle}</p>
            )}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {contactItems.map((item, i) => (
                <span key={i} className="flex items-center gap-1 text-[9.5px] opacity-90">
                  <item.icon size={10} />
                  {item.value}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ paddingLeft: margin, paddingRight: margin, paddingTop: '24px', paddingBottom: '24px' }}>
        <p className="text-[10.5px] text-gray-500 text-right mb-4">{coverLetterData.date}</p>

        <div className="text-[10.5px] text-gray-700 mb-4 space-y-0.5">
          {coverLetterData.recipientName && <p className="font-medium">{coverLetterData.recipientName}</p>}
          {coverLetterData.recipientTitle && <p>{coverLetterData.recipientTitle}</p>}
          {coverLetterData.company && <p>{coverLetterData.company}</p>}
          {coverLetterData.address && <p>{coverLetterData.address}</p>}
        </div>

        <p className="text-[10.5px] text-gray-800 font-medium mb-4">{coverLetterData.greeting}</p>

        <div
          className="text-[10.5px] text-gray-700 leading-relaxed mb-6 whitespace-pre-line pl-3 border-l-2"
          style={{ borderColor: accentColor + '40' }}
        >
          {coverLetterData.body}
        </div>

        <div className="text-[10.5px] text-gray-700">
          <p>{coverLetterData.closing}</p>
          <p className="font-semibold mt-4" style={{ color: accentColor }}>
            {coverLetterData.signature || personalInfo.fullName}
          </p>
        </div>
      </div>
    </div>
  );
}
