import { useCVStore } from '../../../store/useCVStore';
import { useTemplateTheme } from '../../../hooks/useTemplateTheme';

export function CompactCoverLetter() {
  const { personalInfo, coverLetterData } = useCVStore();
  const { fontFamily, margin, accentColor } = useTemplateTheme();

  const contactParts: { value: string; href: string | null }[] = [
    { value: personalInfo.email || '', href: personalInfo.email ? `mailto:${personalInfo.email}` : null },
    { value: personalInfo.phone || '', href: personalInfo.phone ? `tel:${personalInfo.phone}` : null },
    { value: personalInfo.location || '', href: null },
    { value: personalInfo.linkedin || '', href: personalInfo.linkedin ? (personalInfo.linkedin.startsWith('http') ? personalInfo.linkedin : `https://${personalInfo.linkedin}`) : null },
    { value: personalInfo.website || '', href: personalInfo.website ? (personalInfo.website.startsWith('http') ? personalInfo.website : `https://${personalInfo.website}`) : null },
  ].filter((p) => p.value);

  return (
    <div
      className="a4-page"
      style={{
        fontFamily,
        fontSize: '9.5px',
        lineHeight: 1.2,
        paddingLeft: margin,
        paddingRight: margin,
        paddingTop: '20px',
        paddingBottom: '20px',
      }}
    >
      {/* Header */}
      <div className="text-center mb-2">
        <h1 className="text-[16px] font-bold text-gray-900">{personalInfo.fullName}</h1>
        {personalInfo.jobTitle && (
          <p className="text-[9.5px] text-gray-600">{personalInfo.jobTitle}</p>
        )}
        <p className="text-[8.5px] text-gray-400 mt-0.5">
          {contactParts.map((part, i) => (
            <span key={i}>
              {i > 0 && ' | '}
              {part.href ? (
                <a href={part.href} target="_blank" rel="noopener noreferrer" className="hover:underline">{part.value}</a>
              ) : (
                part.value
              )}
            </span>
          ))}
        </p>
      </div>

      <div className="border-b mb-3" style={{ borderColor: accentColor + '40' }} />

      {/* Date */}
      <p className="text-[9px] text-gray-400 text-right mb-3">{coverLetterData.date}</p>

      {/* Recipient */}
      <div className="text-[9px] text-gray-600 mb-3 space-y-0.5">
        {coverLetterData.recipientName && <p className="font-bold text-gray-800">{coverLetterData.recipientName}</p>}
        {coverLetterData.recipientTitle && <p>{coverLetterData.recipientTitle}</p>}
        {coverLetterData.company && <p>{coverLetterData.company}</p>}
        {coverLetterData.address && <p>{coverLetterData.address}</p>}
      </div>

      {/* Greeting */}
      <p className="text-[9px] text-gray-800 font-bold mb-2">{coverLetterData.greeting}</p>

      {/* Body */}
      <div className="text-[9px] text-gray-700 leading-[1.3] mb-4 whitespace-pre-line">
        {coverLetterData.body}
      </div>

      {/* Closing */}
      <div className="text-[9px] text-gray-700">
        <p>{coverLetterData.closing}</p>
        <p className="font-bold mt-2">{coverLetterData.signature || personalInfo.fullName}</p>
      </div>
    </div>
  );
}
