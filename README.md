# Free CV Maker

A free, open-source CV/resume builder that runs entirely in your browser. No sign-up required, no data sent to any server — your information stays on your device.

## Features

- **7 Professional Templates** — Classic, Modern, Minimalist, Creative, Academic, Compact, and Two-Column layouts
- **Cover Letter Builder** — Matching cover letter templates for every CV design
- **Live Preview** — See changes in real time as you edit
- **PDF Export** — Download your CV and cover letter as clean PDF files
- **Drag & Drop Sections** — Reorder sections to highlight what matters most
- **Theme Customization** — Colors, fonts, spacing, margins, and section title styles
- **Profile Photo** — Optional photo with shape and size options
- **Multiple Profiles** — Save and switch between different CV versions
- **Import / Export** — Save your data as JSON and load it back anytime
- **Responsive Design** — Works on desktop and mobile devices
- **Keyboard Shortcut** — `Ctrl + P` to export PDF instantly

## Sections

Personal Info, Summary, Experience, Projects, Education, Involvement, Skills, Certifications, Languages, Awards, Hobbies, and References — each section can be toggled on/off and reordered.

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast builds
- **Tailwind CSS v4** for styling
- **Zustand** for state management
- **@dnd-kit** for drag-and-drop
- **react-to-print** + **pdfjs-dist** for PDF export
- **Lucide React** for icons

## Getting Started

```bash
# Clone the repository
git clone https://github.com/sucreistaken/free-cv-maker.git
cd free-cv-maker

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
npm run preview
```

## License

MIT
