import { cn } from '../../../utils/cn';

interface CompanyNameProps {
  company: string;
  /** Optional site for the employer or the product, rendered as a link on the name. */
  link?: string;
  /** Text that follows the name in the same line, e.g. the location. */
  suffix?: string;
  className?: string;
}

/**
 * Company line of an experience entry. Founders and side products often have a
 * live site worth clicking from the PDF, so the name becomes a link whenever
 * one is set, and stays plain text otherwise.
 */
export function CompanyName({ company, link, suffix, className }: CompanyNameProps) {
  const label = `${company}${suffix ?? ''}`;
  if (!link) return <p className={className}>{label}</p>;

  const href = link.startsWith('http') ? link : `https://${link}`;
  return (
    <p className={className}>
      <a href={href} target="_blank" rel="noopener noreferrer" className={cn('hover:underline')}>
        {company}
      </a>
      {suffix}
    </p>
  );
}
