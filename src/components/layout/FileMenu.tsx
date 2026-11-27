import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Download, FileText, FolderOpen, HelpCircle, Loader2, RotateCcw, Upload } from 'lucide-react';
import { cn } from '../../utils/cn';

interface FileMenuProps {
  onBackup: () => void;
  onLoadBackup: () => void;
  onImportPdf: () => void;
  onHelp: () => void;
  onReset: () => void;
  pdfImporting: boolean;
}

interface Item {
  key: string;
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
  danger?: boolean;
  /** Only listed on phones, where the header has no room for its own button. */
  mobileOnly?: boolean;
  disabled?: boolean;
}

/**
 * One labelled menu for the file actions that used to be three unlabelled icons
 * (JSON export, JSON import, PDF import), plus reset, which is safer one click away.
 * A tiny local menu instead of a UI library: four items do not justify a dependency.
 */
export function FileMenu({ onBackup, onLoadBackup, onImportPdf, onHelp, onReset, pdfImporting }: FileMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const items: (Item | 'divider')[] = [
    { key: 'backup', icon: <Download size={15} />, label: t('header.backupJson'), onSelect: onBackup },
    { key: 'load', icon: <Upload size={15} />, label: t('header.loadBackupJson'), onSelect: onLoadBackup },
    {
      key: 'pdf',
      icon: pdfImporting ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />,
      label: t('header.importFromPdf'),
      onSelect: onImportPdf,
      disabled: pdfImporting,
    },
    'divider',
    { key: 'help', icon: <HelpCircle size={15} />, label: t('header.howToUse'), onSelect: onHelp, mobileOnly: true },
    { key: 'reset', icon: <RotateCcw size={15} />, label: t('header.reset'), onSelect: onReset, danger: true },
  ];

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('header.fileMenu')}
        title={t('header.fileMenu')}
        className={cn(
          'flex items-center gap-1 px-1.5 sm:px-2.5 py-1.5 text-xs font-medium rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors',
          open && 'bg-gray-100 text-gray-900',
        )}
      >
        {pdfImporting ? <Loader2 size={15} className="animate-spin" /> : <FolderOpen size={15} />}
        <span className="hidden sm:inline">{t('header.fileMenu')}</span>
        <ChevronDown size={13} className={cn('hidden sm:block transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-50"
        >
          {items.map((item, i) =>
            item === 'divider' ? (
              <div key={`d${i}`} className="my-1 border-t border-gray-100" />
            ) : (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors disabled:opacity-50',
                  item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50',
                  item.mobileOnly && 'sm:hidden',
                )}
              >
                <span className={item.danger ? 'text-red-500' : 'text-gray-400'}>{item.icon}</span>
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
