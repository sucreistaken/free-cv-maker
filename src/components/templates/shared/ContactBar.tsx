import { MapPin, Mail, Phone, Linkedin, Globe, Flag, Car } from 'lucide-react';
import type { PersonalInfo } from '../../../types/cv';

interface ContactBarProps {
  info: PersonalInfo;
  iconColor?: string;
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
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <item.icon size={10} style={{ color: iconColor || undefined }} className={iconColor ? '' : 'text-gray-500'} />
          {item.value}
        </span>
      ))}
    </div>
  );
}
