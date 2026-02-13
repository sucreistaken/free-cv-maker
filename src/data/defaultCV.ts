import type { CVData, CoverLetterData } from '../types/cv';
import { generateId } from '../utils/id';

export const defaultCV: CVData = {
  personalInfo: {
    fullName: 'Kadir Ay',
    jobTitle: '',
    location: 'Turkey',
    email: 'kadir@kadiray.com',
    phone: '5378830647',
    linkedin: 'in/aykadir',
    github: '',
    website: 'forum.ieu.app/user/kadir',
    nationality: '',
    drivingLicense: '',
    profilePhoto: '',
  },
  summary:
    'I am a senior Computer Engineering student focused on Java, web development, and backend technologies. I have experience building scalable, user-centered applications, including developing and managing a university community platform with 3000+ of active users. Through various team and individual projects, I have strengthened my problem-solving abilities, communication, and collaborative skills. My involvement in ESTIEM has further enhanced my teamwork, leadership, and international exposure. Motivated, adaptable, and committed to continuous learning, I aim to contribute effectively to modern software development teams.',
  experience: [
    {
      id: generateId(),
      title: 'Full Stack Development & Network Automation Internship',
      company: 'Beyaz Kağıt',
      location: 'Adana, Turkey',
      startDate: 'July 2025',
      endDate: 'August 2025',
      bullets: [
        'Developed Python-based SNMP network tools and built internal web/mobile interfaces (Flask & Flutter) for IT automation at Beyaz Kağıt.',
      ],
    },
    {
      id: generateId(),
      title: 'Software Development',
      company: 'Fatih Plastik',
      location: 'Adana',
      startDate: 'January 2025',
      endDate: 'February 2025',
      bullets: [
        'Supported team projects by improving processes and contributing to problem-solving, while being recognized as reliable and collaborative.',
      ],
    },
  ],
  projects: [
    {
      id: generateId(),
      name: 'University Forum Platform',
      link: 'forum.ieu.app',
      date: 'February 2025 - Present',
      bullets: [
        'Developed an online community platform for IEU students, actively used by 3,000+ members, built with Node.js and React. Managed roles, authentication, and UI improvements while deploying on Google Cloud to ensure a reliable and scalable experience for a large student community.',
      ],
    },
    {
      id: generateId(),
      name: 'LearnCraft',
      link: 'github.com/sucreistaken/LearnCraft',
      date: 'October 2025 - Present',
      bullets: [
        'Developed LearnCraft, a learning-assistant platform that generates structured study plans and quizzes from lecture materials, building both the frontend (React, TypeScript) and backend services (Node.js) while contributing to feature design, data processing, and overall system architecture.',
      ],
    },
    {
      id: generateId(),
      name: 'Glamora',
      link: 'github.com/BekirCanTurkmen/Glamora',
      date: '',
      bullets: [
        'Designed Glamora, an AI-enhanced mobile fashion assistant built with Flutter, helping users organize their wardrobe and receive smart, personalized styling guidance.',
      ],
    },
    {
      id: generateId(),
      name: 'SNMP-Based Network Monitoring Tool',
      link: 'github.com/sucreistaken/switchview',
      date: '',
      bullets: [
        'Built an internal SNMP monitoring tool for Beyaz Kağıt, which is still in active use and helps the IT team visualize port, PoE, and device data for faster troubleshooting.',
      ],
    },
  ],
  education: [
    {
      id: generateId(),
      degree: 'Computer Engineering',
      institution: 'Izmir University of Economics',
      year: '2021',
    },
  ],
  involvement: [
    {
      id: generateId(),
      role: 'CR Community Member',
      organization: 'ESTIEM',
      institution: 'Izmir University of Economics',
      startDate: 'February 2021',
      endDate: 'June 2024',
      bullets: [
        'Actively contributed to ESTIEM by hosting international guests, securing sponsorships, and organizing social responsibility and cultural events, demonstrating strong teamwork, communication, and coordination skills in diverse environments.',
      ],
    },
  ],
  skills: [
    {
      id: generateId(),
      category: 'Technical',
      items:
        'JavaScript, React, TypeScript, Node.js, Java, Python, Flutter, MongoDB, Docker, Nginx, Google Cloud, Git, REST APIs, Agile teamwork',
    },
    {
      id: generateId(),
      category: 'Languages',
      items: 'Turkish (Native), English(Fluent), German(Basic)',
    },
  ],
  certifications: [
    {
      id: generateId(),
      name: 'Harvard CS 50',
      issuer: 'harvard.edu',
      year: '2023',
      description:
        'Gained a strong foundation in computer science, algorithms, software engineering, and web development while working with multiple languages, problem-solving and collaborating with a learning community.',
    },
  ],
  languages: [],
  awards: [],
  hobbies: '',
  references: [],
  sections: [
    { id: generateId(), type: 'personalInfo', title: 'Personal Info', visible: true },
    { id: generateId(), type: 'summary', title: 'Summary', visible: true },
    { id: generateId(), type: 'experience', title: 'Experience', visible: true },
    { id: generateId(), type: 'projects', title: 'Project', visible: true },
    { id: generateId(), type: 'education', title: 'Education', visible: true },
    { id: generateId(), type: 'involvement', title: 'Involvement', visible: true },
    { id: generateId(), type: 'skills', title: 'Skills', visible: true },
    { id: generateId(), type: 'certifications', title: 'Certifications', visible: true },
    { id: generateId(), type: 'languages', title: 'Languages', visible: false },
    { id: generateId(), type: 'awards', title: 'Awards', visible: false },
    { id: generateId(), type: 'hobbies', title: 'Hobbies', visible: false },
    { id: generateId(), type: 'references', title: 'References', visible: false },
  ],
};

export const defaultCoverLetter: CoverLetterData = {
  recipientName: '',
  recipientTitle: '',
  company: '',
  address: '',
  date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  greeting: 'Dear Hiring Manager,',
  body: '',
  closing: 'Sincerely,',
  signature: '',
};
