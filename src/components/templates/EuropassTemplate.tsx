import type { ReactNode } from 'react';
import { MapPin, Mail, Phone, Linkedin, Github, Globe } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCVStore } from '../../store/useCVStore';
import { useTemplateTheme } from '../../hooks/useTemplateTheme';
import { parseFormattedText } from '../../utils/formatText';
import { formatDateRange, isNativeLanguage, otherLanguageLevel, parseHobbies, splitListItems } from '../../utils/europass';
import { CEFR_SKILLS } from '../../types/cv';
import type { CVData, CVSection, SectionType } from '../../types/cv';
import { customItemsAsInvolvement } from '../../utils/sections';
import {
  EUROPASS_CEFR_LABELS,
  EUROPASS_LABELS,
  EUROPASS_PAGE_BACKGROUND,
  EUROPASS_PROFICIENCY_LABELS,
  EUROPASS_SECTION_TITLES,
  EUROPASS_STYLE as S,
} from './europass/labels';

/**
 * German CV in the Europass layout: grey sidebar with photo, personal data and
 * contact; main column with upper-case headings, blue timelines and the CEFR
 * language grid. Labels are always German (see europass/labels.ts).
 */

function toHref(value: string): string {
  return value.startsWith('http') ? value : `https://${value}`;
}

type MainSectionType = Exclude<SectionType, 'personalInfo'>;

/**
 * The heading lives in its own wrapper so pagination keeps it with the first entry.
 * Built-in sections carry their type so a click on the fixed German heading still finds
 * the section; a user-added section is found by its own title.
 */
function SectionHeading({ section }: { section: CVSection }) {
  const type = section.type as MainSectionType;
  const custom = type === 'custom';
  return (
    <div className="mb-1.5">
      <h2
        data-section-type={custom ? undefined : type}
        className="text-[16px] font-normal uppercase leading-tight tracking-[0.01em]"
        style={{ color: S.heading }}
      >
        {custom ? section.title : EUROPASS_SECTION_TITLES[type]}
      </h2>
    </div>
  );
}

/** One node of the blue timeline: a line on the left and a dot next to `title`. */
function TimelineEntry({ top, title, children }: { top?: ReactNode; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="break-inside-avoid relative pl-[20px] pb-2">
      <span className="absolute left-[4px] top-0 bottom-0 w-[2px]" style={{ backgroundColor: S.blue }} />
      {top}
      <div className="relative">
        <span
          className="absolute left-[-20px] top-[0.7em] -translate-y-1/2 w-[12px] h-[12px] rounded-full"
          style={{ backgroundColor: S.blue }}
        />
        {title}
      </div>
      {children}
    </div>
  );
}

function DateLine({ dates, location }: { dates: string; location?: string }) {
  if (!dates && !location) return null;
  return (
    <p className="text-[11px]" style={{ color: S.blue }}>
      {dates && <span className="font-bold">{dates}</span>}
      {dates && location ? ' ' : ''}
      {location && <span>{location}</span>}
    </p>
  );
}

function TitleLine({ bold, rest }: { bold: string; rest?: string }) {
  return (
    <p className="text-[14px] leading-snug">
      {bold && <span className="font-bold">{bold}</span>}
      {bold && rest ? ' ' : ''}
      {rest && <span>{rest}</span>}
    </p>
  );
}

function Bullets({ items }: { items: string[] }) {
  const shown = items.filter((b) => b.trim());
  if (shown.length === 0) return null;
  return (
    <ul className="mt-0.5 space-y-0.5">
      {shown.map((b, i) => (
        <li key={`${b}-${i}`} className="flex text-[10.5px]">
          <span className="mr-1.5 shrink-0">•</span>
          <span>{parseFormattedText(b)}</span>
        </li>
      ))}
    </ul>
  );
}

function LinkLine({ url }: { url?: string }) {
  if (!url) return null;
  return (
    <p className="text-[10px] mt-0.5">
      <span className="font-bold mr-1">{EUROPASS_LABELS.website}</span>
      <a href={toHref(url)} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: S.blue }}>
        {url}
      </a>
    </p>
  );
}

function LanguagesSection({ languages }: { languages: CVData['languages'] }) {
  const native = languages.filter(isNativeLanguage);
  const others = languages.filter((l) => !isNativeLanguage(l));
  const hasGrid = others.some((l) => l.cefr);

  return (
    <div className="text-[11px]">
      {native.length > 0 && (
        <p className="mb-1">
          <span className="font-bold uppercase">{EUROPASS_LABELS.nativeLanguages}:</span>{' '}
          {native.map((l) => l.language).join(', ')}
        </p>
      )}
      {others.length > 0 && (
        <>
          <p className="font-bold mb-1">{EUROPASS_LABELS.otherLanguages}:</p>
          {others.map((l) => (
            <div key={l.id} className="break-inside-avoid border-b pb-2 mb-2" style={{ borderColor: S.rule }}>
              {l.cefr ? (
                <>
                  <p className="font-bold mb-1">{l.language}</p>
                  <div className="grid grid-cols-2 gap-x-4 pl-[14px]">
                    {/* Column-wise like the Europass print: 3 receptive/written skills left, 2 spoken right. */}
                    <div className="space-y-[3px]">
                      {CEFR_SKILLS.slice(0, 3).map((skill) => (
                        <p key={skill}>
                          <span className="font-bold">{EUROPASS_CEFR_LABELS[skill]}</span> {l.cefr![skill]}
                        </p>
                      ))}
                    </div>
                    <div className="space-y-[3px]">
                      {CEFR_SKILLS.slice(3).map((skill) => (
                        <p key={skill}>
                          <span className="font-bold">{EUROPASS_CEFR_LABELS[skill]}</span> {l.cefr![skill]}
                        </p>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p>
                  <span className="font-bold">{l.language}</span> {EUROPASS_PROFICIENCY_LABELS[otherLanguageLevel(l)]}
                </p>
              )}
            </div>
          ))}
        </>
      )}
      {hasGrid && <p className="italic text-[10.5px]">{EUROPASS_LABELS.cefrLegend}</p>}
    </div>
  );
}

function SkillsSection({ skills }: { skills: CVData['skills'] }) {
  return (
    <div className="space-y-1 text-[11px]">
      {skills.map((cat) => {
        const items = splitListItems(cat.items);
        if (items.length === 0 && !cat.category) return null;
        return (
          <p key={cat.id} className="break-inside-avoid">
            {cat.category && <span className="font-bold">{cat.category}: </span>}
            {items.map((item, i) => (
              <span key={`${item}-${i}`}>
                {i > 0 && <span className="mx-1.5" style={{ color: '#b5b5b5' }}>|</span>}
                {parseFormattedText(item)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function HobbyItems({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="pl-[26px] text-[11px]">
      {items.map((item, j) => (
        <li key={`${item}-${j}`} className="flex">
          <span className="mr-1.5 shrink-0">•</span>
          <span>{parseFormattedText(item)}</span>
        </li>
      ))}
    </ul>
  );
}

function HobbiesSection({ hobbies }: { hobbies: string }) {
  return (
    <div>
      {parseHobbies(hobbies).map((group, i) =>
        group.title ? (
          <TimelineEntry key={`${group.title}-${i}`} title={<p className="text-[14px] font-bold">{group.title}</p>}>
            <HobbyItems items={group.items} />
          </TimelineEntry>
        ) : (
          // Lines before any "# " heading: the dot sits next to the first item.
          <TimelineEntry key={`untitled-${i}`} title={<HobbyItems items={group.items} />} />
        ),
      )}
    </div>
  );
}

function MainSection({ section, cv }: { section: CVSection; cv: CVData }) {
  const type = section.type as MainSectionType;
  let body: ReactNode = null;
  switch (type) {
    case 'summary':
      body = cv.summary ? <p className="text-[11px] text-justify">{parseFormattedText(cv.summary)}</p> : null;
      break;
    case 'education':
      body = cv.education.length
        ? cv.education.map((e) => (
            <TimelineEntry
              key={e.id}
              top={<DateLine dates={formatDateRange(e.startDate, e.year)} location={e.location} />}
              title={<TitleLine bold={e.degree} rest={e.institution} />}
            >
              {e.gpa && (
                <p className="text-[10.5px]">
                  <span className="font-bold">{EUROPASS_LABELS.grade}</span> {e.gpa}
                </p>
              )}
              <LinkLine url={e.website} />
            </TimelineEntry>
          ))
        : null;
      break;
    case 'experience':
      body = cv.experience.length
        ? cv.experience.map((e) => (
            <TimelineEntry
              key={e.id}
              top={<DateLine dates={formatDateRange(e.startDate, e.endDate)} location={e.location} />}
              title={<TitleLine bold={e.title} rest={e.company} />}
            >
              <LinkLine url={e.link} />
              <Bullets items={e.bullets} />
            </TimelineEntry>
          ))
        : null;
      break;
    case 'involvement':
    case 'custom': {
      const list = type === 'custom' ? customItemsAsInvolvement(section.items) : cv.involvement;
      body = list.length
        ? list.map((e) => (
            <TimelineEntry
              key={e.id}
              top={<DateLine dates={formatDateRange(e.startDate, e.endDate)} />}
              title={<TitleLine bold={e.role} rest={[e.organization, e.institution].filter(Boolean).join(', ')} />}
            >
              <Bullets items={e.bullets} />
            </TimelineEntry>
          ))
        : null;
      break;
    }
    case 'projects':
      body = cv.projects.length
        ? cv.projects.map((p) => (
            <TimelineEntry key={p.id} top={<DateLine dates={p.date} />} title={<TitleLine bold={p.name} />}>
              <LinkLine url={p.link} />
              <Bullets items={p.bullets} />
            </TimelineEntry>
          ))
        : null;
      break;
    case 'certifications':
    case 'awards': {
      const list = type === 'certifications'
        ? cv.certifications.map((c) => ({ id: c.id, title: c.name, issuer: c.issuer, year: c.year, description: c.description }))
        : cv.awards;
      body = list.length
        ? list.map((c) => (
            <TimelineEntry key={c.id} top={<DateLine dates={c.year} />} title={<TitleLine bold={c.title} rest={c.issuer} />}>
              {c.description && <p className="text-[10.5px]">{parseFormattedText(c.description)}</p>}
            </TimelineEntry>
          ))
        : null;
      break;
    }
    case 'languages':
      body = cv.languages.length ? <LanguagesSection languages={cv.languages} /> : null;
      break;
    case 'skills':
      body = cv.skills.some((s) => s.items.trim() || s.category.trim()) ? <SkillsSection skills={cv.skills} /> : null;
      break;
    case 'hobbies':
      body = cv.hobbies.trim() ? <HobbiesSection hobbies={cv.hobbies} /> : null;
      break;
    case 'references':
      body = cv.references.length ? (
        <div className="space-y-1.5 text-[11px]">
          {cv.references.map((r) => (
            <div key={r.id} className="break-inside-avoid">
              <p className="font-bold">{r.name}</p>
              {(r.title || r.company) && <p>{[r.title, r.company].filter(Boolean).join(', ')}</p>}
              {(r.email || r.phone) && <p>{[r.email, r.phone].filter(Boolean).join(' | ')}</p>}
            </div>
          ))}
        </div>
      ) : null;
      break;
  }
  if (!body) return null;
  return (
    <section>
      <SectionHeading section={section} />
      <div>{body}</div>
    </section>
  );
}

function InfoLine({ label, value }: { label: string; value?: string }) {
  if (!value?.trim()) return null;
  return (
    <p className="text-[11px] mb-1.5">
      <span className="font-bold">{label}:</span> <span>{value}</span>
    </p>
  );
}

function ContactRow({ icon: Icon, value, href }: { icon: LucideIcon; value: string; href?: string }) {
  return (
    <div className="flex items-start gap-2.5 text-[10.5px] mb-2.5">
      <Icon size={15} strokeWidth={2.4} className="shrink-0 mt-[1px]" style={{ color: S.blue }} />
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="underline break-all">
          {value}
        </a>
      ) : (
        <span className="break-words min-w-0">{value}</span>
      )}
    </div>
  );
}

export function EuropassTemplate() {
  const cv = useCVStore();
  const { personalInfo: p, sections } = cv;
  const { zoom, effectiveA4Height, photoVisible } = useTemplateTheme();

  const mainSections = sections.filter((s) => s.visible && s.type !== 'personalInfo');

  const contacts: { icon: LucideIcon; value: string; href?: string }[] = [
    { icon: MapPin, value: p.location },
    { icon: Mail, value: p.email, href: `mailto:${p.email}` },
    { icon: Phone, value: p.phone },
    { icon: Linkedin, value: p.linkedin, href: toHref(p.linkedin) },
    { icon: Github, value: p.github, href: toHref(p.github) },
    { icon: Globe, value: p.website, href: toHref(p.website) },
  ].filter((c) => c.value.trim());

  return (
    <div
      className="a4-page flex"
      lang="de"
      style={{
        fontFamily: S.fontFamily,
        zoom,
        lineHeight: 1.45,
        color: S.text,
        minHeight: `${effectiveA4Height}px`,
        paddingTop: '28px',
        paddingBottom: '28px',
        background: EUROPASS_PAGE_BACKGROUND,
        ['--a4-break-height' as string]: `${effectiveA4Height}px`,
      }}
    >
      {/* Print only: Chrome repeats fixed elements on every page, so the grey column reaches the page bottom. */}
      <div aria-hidden="true" className="europass-print-strip" style={{ width: S.sidebarWidth, background: S.sidebarBg }} />
      <aside className="shrink-0 px-[22px]" style={{ width: S.sidebarWidth }}>
        {p.profilePhoto && photoVisible && (
          <img
            src={p.profilePhoto}
            alt="Profilfoto"
            className="block mx-auto w-[126px] h-[126px] rounded-full object-cover"
            style={{ border: '3px solid #c9c9c9' }}
          />
        )}
        <h1 className="text-[19px] font-bold text-center mt-4 mb-1 leading-tight" style={{ color: '#555555' }}>
          {p.fullName}
        </h1>
        {p.jobTitle && <p className="text-[11px] text-center mb-1">{p.jobTitle}</p>}
        <div className="mt-4">
          <InfoLine label={EUROPASS_LABELS.birthDate} value={p.birthDate} />
          <InfoLine label={EUROPASS_LABELS.nationality} value={p.nationality} />
          <InfoLine label={EUROPASS_LABELS.gender} value={p.gender} />
          <InfoLine label={EUROPASS_LABELS.drivingLicense} value={p.drivingLicense} />
        </div>
        {contacts.length > 0 && (
          <div className="mt-7">
            <h3 className="text-[14px] font-bold uppercase mb-3" style={{ color: S.heading }}>
              {EUROPASS_LABELS.contact}
            </h3>
            {contacts.map((c, i) => (
              <ContactRow key={i} icon={c.icon} value={c.value} href={c.href} />
            ))}
          </div>
        )}
      </aside>

      <div className="flex-1 min-w-0 pl-[22px] pr-[24px] flex flex-col gap-[14px]">
        {mainSections.map((s) => (
          <MainSection key={s.id} section={s} cv={cv} />
        ))}
      </div>
    </div>
  );
}
