import { MapPin, Mail, Phone, Linkedin, Globe } from 'lucide-react';
import { useCVStore } from '../../../store/useCVStore';
import { useTemplateTheme } from '../../../hooks/useTemplateTheme';

export function ModernCoverLetter() {
  const { personalInfo, coverLetterData } = useCVStore();
  const { fontFamily, zoom, lineHeight, margin, primaryColor, photoSize, photoShape, photoVisible } = useTemplateTheme();

  const contactItems = [
    { icon: MapPin, value: personalInfo.location },
    { icon: Mail, value: personalInfo.email },
    { icon: Phone, value: personalInfo.phone },
    { icon: Linkedin, value: personalInfo.linkedin },
    { icon: Globe, value: personalInfo.website },
  ].filter((item) => item.value);

  return (
    <div className="a4-page flex" style={{ fontFamily, zoom, lineHeight }}>
      {/* Sidebar */}
      <div className="w-[220px] shrink-0 px-5 py-8 text-white" style={{ backgroundColor: primaryColor }}>
        {personalInfo.profilePhoto && photoVisible ? (
          <img src={personalInfo.profilePhoto} alt="" className="object-cover mx-auto mb-4 border-2 border-white/30" style={{ width: photoSize, height: photoSize, borderRadius: photoShape }} />
        ) : (
          <div className="bg-white/20 mx-auto mb-4 flex items-center justify-center text-2xl font-bold" style={{ width: photoSize, height: photoSize, borderRadius: photoShape }}>
            {personalInfo.fullName.split(' ').map((n) => n[0]).join('')}
          </div>
        )}
        <h1 className="text-[16px] font-bold text-center mb-1">{personalInfo.fullName}</h1>
        {personalInfo.jobTitle && (
          <p className="text-[10px] text-center opacity-80 mb-6">{personalInfo.jobTitle}</p>
        )}
        {!personalInfo.jobTitle && <div className="mb-6" />}

        <div className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-70">Contact</h3>
          {contactItems.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-[9.5px] opacity-90">
              <item.icon size={10} className="mt-0.5 shrink-0" />
              <span className="break-all">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 py-8" style={{ paddingLeft: margin, paddingRight: margin }}>
        <p className="text-[10.5px] text-gray-500 text-right mb-6">{coverLetterData.date}</p>

        <div className="text-[10.5px] text-gray-700 mb-4 space-y-0.5">
          {coverLetterData.recipientName && <p className="font-medium">{coverLetterData.recipientName}</p>}
          {coverLetterData.recipientTitle && <p>{coverLetterData.recipientTitle}</p>}
          {coverLetterData.company && <p>{coverLetterData.company}</p>}
          {coverLetterData.address && <p>{coverLetterData.address}</p>}
        </div>

        <p className="text-[10.5px] text-gray-800 font-medium mb-4">{coverLetterData.greeting}</p>

        <div className="text-[10.5px] text-gray-700 leading-relaxed mb-6 whitespace-pre-line">
          {coverLetterData.body}
        </div>

        <div className="text-[10.5px] text-gray-700">
          <p>{coverLetterData.closing}</p>
          <p className="font-semibold mt-4">{coverLetterData.signature || personalInfo.fullName}</p>
        </div>
      </div>
    </div>
  );
}
