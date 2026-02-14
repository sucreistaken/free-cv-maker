import type { CVData, CoverLetterData } from '../types/cv';
import { generateId } from '../utils/id';

export const defaultCV: CVData = {
  personalInfo: {
    fullName: 'Alex Morgan',
    jobTitle: 'Full Stack Developer',
    location: 'Berlin, Germany',
    email: 'alex.morgan@email.com',
    phone: '+49 170 1234567',
    linkedin: 'in/alexmorgan',
    github: 'github.com/alexmdev',
    website: 'alexmorgan.dev',
    nationality: '',
    drivingLicense: '',
    profilePhoto: '',
  },
  summary:
    'Full stack developer with 4+ years of experience building scalable web applications. Proficient in React, Node.js, and cloud infrastructure. Passionate about clean code, developer experience, and delivering user-centric products. Proven track record of leading small teams, shipping features end-to-end, and mentoring junior developers.',
  experience: [
    {
      id: generateId(),
      title: 'Senior Frontend Developer',
      company: 'TechFlow GmbH',
      location: 'Berlin, Germany',
      startDate: 'Mar 2023',
      endDate: 'Present',
      bullets: [
        'Led the migration of a legacy Angular app to React + TypeScript, reducing bundle size by 40% and improving page load times by 2 seconds.',
        'Designed and implemented a component library used across 3 product teams, standardizing UI patterns and accelerating development velocity.',
        'Mentored 2 junior developers through weekly code reviews and pair programming sessions.',
      ],
    },
    {
      id: generateId(),
      title: 'Full Stack Developer',
      company: 'CloudBase Inc.',
      location: 'Amsterdam, Netherlands',
      startDate: 'Jun 2021',
      endDate: 'Feb 2023',
      bullets: [
        'Built RESTful APIs serving 50K+ daily active users using Node.js, Express, and PostgreSQL.',
        'Implemented CI/CD pipelines with GitHub Actions, reducing deployment time from 45 minutes to 8 minutes.',
        'Collaborated with product and design teams to ship 12 major features across 4 quarterly releases.',
      ],
    },
    {
      id: generateId(),
      title: 'Junior Web Developer',
      company: 'StartupHub',
      location: 'Remote',
      startDate: 'Sep 2020',
      endDate: 'May 2021',
      bullets: [
        'Developed responsive landing pages and dashboards using React, Tailwind CSS, and Chart.js.',
        'Integrated third-party APIs (Stripe, SendGrid, Google Maps) to extend platform functionality.',
      ],
    },
  ],
  projects: [
    {
      id: generateId(),
      name: 'DevBoard',
      link: 'github.com/alexmdev/devboard',
      date: 'Jan 2024 - Present',
      bullets: [
        'Open-source developer dashboard that aggregates GitHub activity, CI status, and project metrics into a single view. Built with Next.js, tRPC, and Prisma. 500+ GitHub stars.',
      ],
    },
    {
      id: generateId(),
      name: 'BudgetPal',
      link: 'github.com/alexmdev/budgetpal',
      date: 'Aug 2023 - Dec 2023',
      bullets: [
        'Personal finance tracker with recurring transaction support, category analytics, and CSV import/export. Built with React Native and SQLite for offline-first mobile experience.',
      ],
    },
  ],
  education: [
    {
      id: generateId(),
      degree: 'B.Sc. Computer Science',
      institution: 'Technical University of Munich',
      year: '2020',
    },
  ],
  involvement: [
    {
      id: generateId(),
      role: 'Lead Organizer',
      organization: 'HackMunich',
      institution: 'Technical University of Munich',
      startDate: 'Oct 2018',
      endDate: 'Jul 2020',
      bullets: [
        'Organized an annual 48-hour hackathon with 300+ participants and 15 corporate sponsors. Managed logistics, mentoring, and judging across 3 editions.',
      ],
    },
  ],
  skills: [
    {
      id: generateId(),
      category: 'Frontend',
      items: 'React, TypeScript, Next.js, Tailwind CSS, Redux, Vue.js, HTML5, CSS3',
    },
    {
      id: generateId(),
      category: 'Backend',
      items: 'Node.js, Express, Python, PostgreSQL, MongoDB, Redis, GraphQL, REST APIs',
    },
    {
      id: generateId(),
      category: 'DevOps & Tools',
      items: 'Docker, AWS, GitHub Actions, Vercel, Nginx, Git, Linux, Figma',
    },
  ],
  certifications: [
    {
      id: generateId(),
      name: 'AWS Certified Cloud Practitioner',
      issuer: 'Amazon Web Services',
      year: '2023',
      description: '',
    },
    {
      id: generateId(),
      name: 'Meta Front-End Developer Professional Certificate',
      issuer: 'Coursera / Meta',
      year: '2022',
      description: '',
    },
  ],
  languages: [
    {
      id: generateId(),
      language: 'English',
      proficiency: 'native',
    },
    {
      id: generateId(),
      language: 'German',
      proficiency: 'fluent',
    },
    {
      id: generateId(),
      language: 'Spanish',
      proficiency: 'intermediate',
    },
  ],
  awards: [],
  hobbies: 'Open-source contribution, rock climbing, photography, mechanical keyboards',
  references: [],
  sections: [
    { id: generateId(), type: 'personalInfo', title: 'Personal Info', visible: true },
    { id: generateId(), type: 'summary', title: 'Summary', visible: true },
    { id: generateId(), type: 'experience', title: 'Experience', visible: true },
    { id: generateId(), type: 'projects', title: 'Projects', visible: true },
    { id: generateId(), type: 'education', title: 'Education', visible: true },
    { id: generateId(), type: 'involvement', title: 'Involvement', visible: true },
    { id: generateId(), type: 'skills', title: 'Skills', visible: true },
    { id: generateId(), type: 'certifications', title: 'Certifications', visible: true },
    { id: generateId(), type: 'languages', title: 'Languages', visible: true },
    { id: generateId(), type: 'awards', title: 'Awards', visible: false },
    { id: generateId(), type: 'hobbies', title: 'Hobbies', visible: true },
    { id: generateId(), type: 'references', title: 'References', visible: false },
  ],
};

export const defaultCoverLetter: CoverLetterData = {
  recipientName: 'Sarah Johnson',
  recipientTitle: 'Engineering Manager',
  company: 'Acme Technologies',
  address: 'Munich, Germany',
  date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  greeting: 'Dear Ms. Johnson,',
  body: 'I am writing to express my interest in the Senior Full Stack Developer position at Acme Technologies. With over four years of experience building scalable web applications and leading frontend migrations, I am confident I can contribute meaningfully to your engineering team.\n\nIn my current role at TechFlow GmbH, I led the successful migration of a legacy Angular application to React and TypeScript, resulting in a 40% reduction in bundle size and significantly improved user experience. I also designed a shared component library adopted by three product teams, which standardized our UI patterns and accelerated development across the organization.\n\nI am particularly drawn to Acme Technologies because of your commitment to developer experience and your open-source contributions. I would welcome the opportunity to bring my technical skills and collaborative approach to your team.\n\nThank you for considering my application. I look forward to discussing how I can contribute to your projects.',
  closing: 'Best regards,',
  signature: 'Alex Morgan',
};
