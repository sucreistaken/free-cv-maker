# Free CV Maker

A free, open-source CV/resume builder that runs entirely in your browser — no sign-up required. Your data lives on your device by default. On first visit you're asked for consent to also sync what you build to our server, to help us understand usage and guide development — nothing is sent unless you accept, and you can change your choice anytime. We don't sell it or share it with third parties. See [Privacy](#privacy) below.

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

## Privacy

NextCV runs entirely in your browser — nothing you type is required to leave your
device to use the app, and there is no sign-up or account.

On your first visit, a banner asks for your consent before anything is sent
anywhere. If you decline (or don't answer), NextCV behaves exactly as before:
everything stays in your browser's local storage. If you accept, NextCV syncs
a copy of what you build to our own server — including any PDF you import — tied
to a randomly generated identifier stored in your browser, to help us understand
how the product is actually used (which templates are popular, where people get
stuck) and guide future development. You can change your choice at any time from
the "Privacy Choice" link in the footer. Note that the CV content itself (names,
emails, work history, etc.) is stored as you typed it if you accept, so treat
anything you enter into NextCV as potentially retained by us — it is not
anonymous data in the strict sense. See the in-app Privacy Policy / KVKK notice
(footer links) for the full picture, including how to request deletion.

We do not sell this data, share it with third parties, or use it for advertising.
It is used solely by the developer to improve NextCV.

## License

MIT
