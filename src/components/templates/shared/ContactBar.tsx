import { MapPin, Mail, Phone, Linkedin, Globe, Flag, Car } from 'lucide-react';
import type { PersonalInfo } from '../../../types/cv';
import type { LucideIcon } from 'lucide-react';

interface ContactBarProps {
  info: PersonalInfo;
  iconColor?: string;
}

function getHref(icon: LucideIcon, value: string): string | null {
  if (icon === Mail) return `mailto:${value}`;
  if (icon === Phone) return `tel:${value}`;
  if (icon === Linkedin || icon === Globe) {
    return value.startsWith('http') ? value : `https://${value}`;
  }
  return null;
}

export function ContactBar({ info, iconColor }: ContactBarProps) {
  const items = [
    { icon: MapPin, value: info.location },
    { icon: Mail, value: info.email },
    { icon: Phone, value: info.phone },
    { icon: Linkedin, value: info.linkedin },
    { icon: Globe, value: info.website },
    { icon: Flag, value: info.nationality },
    { icon: Car, value: info.drivingLicense ? `License: ${info.drivingLicense}` : '' },
  ].filter((item) => item.value);

  return (
    <div className="flex items-center justify-center gap-4 text-[10px] text-gray-600 flex-wrap">
      {items.map((item, i) => {
        const href = getHref(item.icon, item.value!);
        const iconEl = <item.icon size={10} style={{ color: iconColor || undefined }} className={iconColor ? '' : 'text-gray-500'} />;
        return href ? (
          <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
            {iconEl}
            {item.value}
          </a>
        ) : (
          <span key={i} className="flex items-center gap-1">
            {iconEl}
            {item.value}
          </span>
        );
      })}
    </div>
  );
}
