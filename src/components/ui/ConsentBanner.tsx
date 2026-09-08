import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { useConsentStore } from '../../store/useConsentStore';
import { LegalModal } from '../legal/LegalModal';

export function ConsentBanner() {
  const { t } = useTranslation();
  const status = useConsentStore((s) => s.status);
  const accept = useConsentStore((s) => s.accept);
  const decline = useConsentStore((s) => s.decline);
  const [showDetails, setShowDetails] = useState(false);

  if (status !== 'pending') return null;

  return (
    <>
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-xs text-gray-600 flex-1">
            {t('consent.message')}{' '}
            <button
              onClick={() => setShowDetails(true)}
              className="font-semibold text-primary hover:text-primary-dark underline underline-offset-2"
            >
              {t('consent.detailsLink')}
            </button>
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="secondary" size="sm" onClick={decline}>
              {t('consent.decline')}
            </Button>
            <Button variant="primary" size="sm" onClick={accept}>
              {t('consent.accept')}
            </Button>
          </div>
        </div>
      </div>

      <LegalModal open={showDetails} page="kvkk" onClose={() => setShowDetails(false)} />
    </>
  );
}
