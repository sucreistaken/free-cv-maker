import { MapPin, Mail, Phone, Linkedin, Globe, Flag, Car, CalendarDays } from 'lucide-react';
import type { PersonalInfo } from '../../../types/cv';
import type { LucideIcon } from 'lucide-react';

interface ContactBarProps {
  info: PersonalInfo;
  iconColor?: string;
  /** When false, items are plain text separated by a vertical rule. */
  showIcons?: boolean;
}

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function getHref(icon: LucideIcon, value: string): string | null {
  if (icon === Mail) return `mailto:${value}`;
  if (icon === Phone) return `tel:${value.replace(/[^\d+\-() ]/g, '')}`;
  if (icon === Linkedin || icon === Globe) {
    if (!isSafeUrl(value)) return null;
    return value.startsWith('http') ? value : `https://${value}`;
  }
  return null;
}

export function ContactBar({ info, iconColor, showIcons = true }: ContactBarProps) {
  const items = [
    { icon: MapPin, value: info.location },
    { icon: Mail, value: info.email },
    { icon: Phone, value: info.phone },
    { icon: Linkedin, value: info.linkedin },
    { icon: Globe, value: info.website },
    { icon: Flag, value: info.nationality },
    { icon: Car, value: info.drivingLicense ? `License: ${info.drivingLicense}` : '' },
    { icon: CalendarDays, value: info.birthDate || '' },
  ].filter((item) => item.value);

  return (
    <div
      className={`flex items-center justify-center text-[10px] text-gray-600 flex-wrap ${
        showIcons ? 'gap-4' : 'gap-x-2 gap-y-1'
      }`}
    >
      {items.map((item, i) => {
        const href = getHref(item.icon, item.value!);
        const label = href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
            {showIcons && <item.icon size={10} style={{ color: iconColor || undefined }} className={iconColor ? '' : 'text-gray-500'} />}
            {item.value}
          </a>
        ) : (
          <span className="flex items-center gap-1">
            {showIcons && <item.icon size={10} style={{ color: iconColor || undefined }} className={iconColor ? '' : 'text-gray-500'} />}
            {item.value}
          </span>
        );

        return (
          <span key={i} className="flex items-center gap-x-2">
            {!showIcons && i > 0 && <span className="text-gray-300">|</span>}
            {label}
          </span>
        );
      })}
    </div>
  );
}
