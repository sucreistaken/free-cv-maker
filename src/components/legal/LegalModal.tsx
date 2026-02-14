import { Dialog } from '../ui/Dialog';
import { PrivacyPolicy } from './PrivacyPolicy';
import { TermsOfService } from './TermsOfService';
import { KVKKPolicy } from './KVKKPolicy';

export type LegalPage = 'privacy' | 'terms' | 'kvkk';

interface LegalModalProps {
  open: boolean;
  page: LegalPage;
  onClose: () => void;
}

const titles: Record<LegalPage, string> = {
  privacy: 'Gizlilik Politikası',
  terms: 'Kullanım Koşulları',
  kvkk: 'KVKK Aydınlatma Metni',
};

const pages: Record<LegalPage, React.FC> = {
  privacy: PrivacyPolicy,
  terms: TermsOfService,
  kvkk: KVKKPolicy,
};

export function LegalModal({ open, page, onClose }: LegalModalProps) {
  const Content = pages[page];
  return (
    <Dialog open={open} onClose={onClose} title={titles[page]} size="xl">
      <Content />
    </Dialog>
  );
}
