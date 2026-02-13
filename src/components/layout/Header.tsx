import { useRef, useState } from 'react';
import { Printer, RotateCcw, Download, Upload, FileText, Loader2, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { useCVStore } from '../../store/useCVStore';
import { useProfileStore } from '../../store/useProfileStore';
import { templates } from '../../constants/templates';
import type { TemplateType, DocumentType } from '../../types/cv';
import { exportToJson, downloadJsonFile, validateImportData } from '../../utils/export';
import { parsePdfToCV } from '../../utils/pdfImport';
import { ProfileManager } from './ProfileManager';

interface HeaderProps {
  onPrint: () => void;
}

export function Header({ onPrint }: HeaderProps) {
  const { template, setTemplate, theme, activeDocument, setActiveDocument, loadFromImport: loadAppSettings } = useAppStore();
  const resetToDefault = useCVStore((s) => s.resetToDefault);
  const { profiles, activeProfileId, switchProfile } = useProfileStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [pdfImporting, setPdfImporting] = useState(false);

  const handleExport = () => {
    const cvState = useCVStore.getState();
    const { personalInfo, summary, experience, projects, education, involvement, skills, certifications, languages, awards, hobbies, references, sections, coverLetterData } = cvState;
    const cvData = { personalInfo, summary, experience, projects, education, involvement, skills, certifications, languages, awards, hobbies, references, sections };
    const json = exportToJson(cvData, { template, theme }, coverLetterData);
    const name = personalInfo.fullName.replace(/\s+/g, '_') || 'cv';
    downloadJsonFile(json, `${name}_cv.json`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = validateImportData(reader.result as string);
      if (!result.valid) {
        alert(`Import failed: ${result.error}`);
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
      alert(`PDF import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight hidden sm:block">CV Builder</h1>

          {/* Profile selector */}
          <div className="flex items-center gap-1">
            <select
              value={activeProfileId}
              onChange={(e) => handleProfileSwitch(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary max-w-[120px]"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button
              onClick={() => setShowProfileManager(true)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Manage Profiles"
            >
              <Users size={15} />
            </button>
          </div>

          {/* Document toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {(['cv', 'coverLetter'] as DocumentType[]).map((doc) => (
              <button
                key={doc}
                onClick={() => setActiveDocument(doc)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  activeDocument === doc
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {doc === 'cv' ? 'CV' : 'Cover Letter'}
              </button>
            ))}
          </div>

          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value as TemplateType)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary hidden md:block"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={handleExport} title="Export JSON">
            <Download size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} title="Import JSON">
            <Upload size={16} />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <Button variant="ghost" size="sm" onClick={() => pdfInputRef.current?.click()} title="Import PDF" disabled={pdfImporting}>
            {pdfImporting ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
          </Button>
          <input
            ref={pdfInputRef}
            type="file"
            accept=".pdf"
            onChange={handlePdfImport}
            className="hidden"
          />
          <div className="w-px h-6 bg-gray-200" />
          <Button variant="ghost" size="sm" onClick={resetToDefault} title="Reset to default">
            <RotateCcw size={16} />
          </Button>
          <Button variant="primary" size="sm" onClick={onPrint}>
            <Printer size={16} />
            <span className="hidden lg:inline">Print / PDF</span>
          </Button>
        </div>
      </header>

      <ProfileManager open={showProfileManager} onClose={() => setShowProfileManager(false)} />
    </>
  );
}
