import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Printer, RotateCcw, Download, Upload, FileText, Loader2, Users, HelpCircle, Maximize, Minimize } from 'lucide-react';
import { Button } from '../ui/Button';
import { toast } from '../ui/Toast';
import { useAppStore } from '../../store/useAppStore';
import { useCVStore } from '../../store/useCVStore';
import { useProfileStore } from '../../store/useProfileStore';
import { templates } from '../../constants/templates';
import type { TemplateType, DocumentType } from '../../types/cv';
import { exportToJson, downloadJsonFile, validateImportData } from '../../utils/export';
import { parsePdfToCV } from '../../utils/pdfImport';
import { markExported } from '../../hooks/useExportReminder';
import { ProfileManager } from './ProfileManager';
import { OnboardingTour } from '../ui/OnboardingTour';

interface HeaderProps {
  onPrint: () => void;
}

export function Header({ onPrint }: HeaderProps) {
  const { t } = useTranslation();
  const { template, setTemplate, theme, activeDocument, setActiveDocument, language, setLanguage, loadFromImport: loadAppSettings } = useAppStore();
  const resetToDefault = useCVStore((s) => s.resetToDefault);
  const { profiles, activeProfileId, switchProfile } = useProfileStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [pdfImporting, setPdfImporting] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canFullscreen = document.fullscreenEnabled;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleExport = () => {
    const cvState = useCVStore.getState();
    const { personalInfo, summary, experience, projects, education, involvement, skills, certifications, languages, awards, hobbies, references, sections, coverLetterData } = cvState;
    const cvData = { personalInfo, summary, experience, projects, education, involvement, skills, certifications, languages, awards, hobbies, references, sections };
    const json = exportToJson(cvData, { template, theme }, coverLetterData);
    const name = personalInfo.fullName.replace(/\s+/g, '_') || 'cv';
    downloadJsonFile(json, `${name}_cv.json`);
    markExported();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = validateImportData(reader.result as string);
      if (!result.valid) {
        toast('error', t('toast.importFailed', { error: result.error }));
        return;
      }
      useCVStore.getState().loadFromImport(result.data.cvData);
      loadAppSettings(result.data.appSettings);
      if (result.data.coverLetterData) {
        const cl = result.data.coverLetterData;
        Object.entries(cl).forEach(([key, value]) => {
          useCVStore.getState().updateCoverLetter(key as keyof typeof cl, value);
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfImporting(true);
    try {
      const cvData = await parsePdfToCV(file);
      useCVStore.getState().loadFromImport(cvData);
    } catch (err) {
      toast('error', t('toast.pdfImportFailed', { error: err instanceof Error ? err.message : 'Unknown error' }));
    } finally {
      setPdfImporting(false);
      e.target.value = '';
    }
  };

  const handleProfileSwitch = (id: string) => {
    switchProfile(id);
    useCVStore.getState()._syncFromProfile();
    useAppStore.getState()._syncFromProfile();
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 shrink-0 z-10">
        {/* Row 1: Brand + actions */}
        <div className="h-12 flex items-center justify-between px-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <a
              href="https://forum.ieu.app/user/kadir"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 group shrink-0"
            >
              <h1 className="text-lg font-bold text-gray-900 tracking-tight leading-tight">{t('header.brand')}</h1>
              <span className="text-[10px] text-gray-400 group-hover:text-primary transition-colors border-l border-gray-200 pl-2">
                {t('header.byAuthor')}
              </span>
            </a>

            {/* Profile selector */}
            <div className="flex items-center gap-1">
              <select
                value={activeProfileId}
                onChange={(e) => handleProfileSwitch(e.target.value)}
                className="text-xs sm:text-sm border border-gray-300 rounded-lg px-1.5 sm:px-2 py-1 sm:py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary max-w-[100px] sm:max-w-[120px]"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button
                onClick={() => setShowProfileManager(true)}
                className="p-1 sm:p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title={t('header.manageProfiles')}
              >
                <Users size={15} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Fullscreen */}
            {canFullscreen && (
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-1 px-1.5 sm:px-2 py-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title={isFullscreen ? t('header.exitFullscreen') : t('header.fullscreen')}
              >
                {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                <span className="hidden sm:inline text-[10px] sm:text-xs font-medium">
                  {isFullscreen ? t('header.exitFullscreen') : t('header.fullscreen')}
                </span>
              </button>
            )}

            {/* How to use */}
            <button
              onClick={() => setShowTutorial(true)}
              className="p-1 sm:p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title={t('header.howToUse')}
            >
              <HelpCircle size={16} />
            </button>

            {/* Language toggle */}
            <div className="flex rounded-md border border-gray-300 overflow-hidden">
              <button
                onClick={() => setLanguage('tr')}
                className={`px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs font-semibold transition-colors ${
                  language === 'tr'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                TR
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs font-semibold transition-colors border-l border-gray-300 ${
                  language === 'en'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                EN
              </button>
            </div>

            <Button variant="ghost" size="sm" onClick={handleExport} title={t('header.exportJson')}>
              <Download size={15} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} title={t('header.importJson')}>
              <Upload size={15} />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <Button variant="ghost" size="sm" onClick={() => pdfInputRef.current?.click()} title={t('header.importPdf')} disabled={pdfImporting}>
              {pdfImporting ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
            </Button>
            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf"
              onChange={handlePdfImport}
              className="hidden"
            />
            <div className="w-px h-5 bg-gray-200 hidden sm:block" />
            <Button variant="ghost" size="sm" onClick={resetToDefault} title={t('header.reset')}>
              <RotateCcw size={15} />
            </Button>
            <Button variant="primary" size="sm" onClick={onPrint}>
              <Printer size={15} />
              <span className="hidden lg:inline">{t('header.printPdf')}</span>
            </Button>
          </div>
        </div>

        {/* Row 2: Template + Document toggle */}
        <div className="h-9 flex items-center gap-2 px-3 sm:px-4 border-t border-gray-100 overflow-x-auto">
          {/* Document toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 shrink-0">
            {(['cv', 'coverLetter'] as DocumentType[]).map((doc) => (
              <button
                key={doc}
                onClick={() => setActiveDocument(doc)}
                className={`px-2 sm:px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${activeDocument === doc
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {doc === 'cv' ? t('header.cv') : t('header.coverLetter')}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-200 shrink-0" />

          {/* Template selector - visible on all screens */}
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value as TemplateType)}
            className="text-xs sm:text-sm border border-gray-300 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {templates.map((tmpl) => (
              <option key={tmpl.id} value={tmpl.id}>{t(`templates.${tmpl.id}`)}</option>
            ))}
          </select>
        </div>
      </header>

      <ProfileManager open={showProfileManager} onClose={() => setShowProfileManager(false)} />
      <OnboardingTour open={showTutorial} onClose={() => setShowTutorial(false)} />
    </>
  );
}
