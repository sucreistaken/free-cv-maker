import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LegalModal } from '../legal/LegalModal';
import type { LegalPage } from '../legal/LegalModal';
import { useConsentStore } from '../../store/useConsentStore';

export function Footer() {
  const { t } = useTranslation();
  const [legalPage, setLegalPage] = useState<LegalPage | null>(null);
  const consentStatus = useConsentStore((s) => s.status);
  const resetConsent = useConsentStore((s) => s.reset);

  return (
    <>
      <footer className="h-8 bg-white border-t border-gray-200 flex items-center justify-between px-4 shrink-0 text-[11px] text-gray-400 print:hidden">
        <span>
          {t('footer.copyright', { year: new Date().getFullYear() })}
          {' · '}
          <a
            href="https://forum.ieu.app/user/kadir"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-primary transition-colors font-medium"
          >
            {t('footer.madeBy')}
          </a>
        </span>
        <div className="flex items-center gap-3">
          <button onClick={() => setLegalPage('privacy')} className="hover:text-gray-600 transition-colors">
            {t('footer.privacy')}
          </button>
          <button onClick={() => setLegalPage('terms')} className="hover:text-gray-600 transition-colors">
            {t('footer.terms')}
          </button>
          <button onClick={() => setLegalPage('kvkk')} className="hover:text-gray-600 transition-colors">
            {t('footer.kvkk')}
          </button>
          {consentStatus !== 'pending' && (
            <button onClick={resetConsent} className="hover:text-gray-600 transition-colors">
              {t('footer.privacyChoice')}
            </button>
          )}
        </div>
      </footer>

      <LegalModal
        open={legalPage !== null}
        page={legalPage ?? 'privacy'}
        onClose={() => setLegalPage(null)}
      />
    </>
  );
}
