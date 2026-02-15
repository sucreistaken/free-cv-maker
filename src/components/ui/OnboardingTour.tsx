import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  LayoutGrid,
  FileText,
  ArrowDownUp,
  FileUp,
  Printer,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const STEPS = [
  { icon: Sparkles, titleKey: 'onboarding.welcomeTitle', descKey: 'onboarding.welcomeDesc' },
  { icon: LayoutGrid, titleKey: 'onboarding.templatesTitle', descKey: 'onboarding.templatesDesc' },
  { icon: FileText, titleKey: 'onboarding.documentsTitle', descKey: 'onboarding.documentsDesc' },
  { icon: ArrowDownUp, titleKey: 'onboarding.exportImportTitle', descKey: 'onboarding.exportImportDesc' },
  { icon: FileUp, titleKey: 'onboarding.pdfImportTitle', descKey: 'onboarding.pdfImportDesc' },
  { icon: Printer, titleKey: 'onboarding.printTitle', descKey: 'onboarding.printDesc' },
] as const;

interface OnboardingTourProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingTour({ open, onClose }: OnboardingTourProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  if (!open) return null;

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

  const close = () => {
    setStep(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Content */}
        <div className="flex flex-col items-center px-8 pt-10 pb-6 text-center">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 text-blue-600 mb-6">
            <Icon size={40} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {t(current.titleKey)}
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
            {t(current.descKey)}
          </p>
        </div>

        {/* Dot indicator */}
        <div className="flex justify-center gap-2 pb-6">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`Step ${i + 1}`}
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-all duration-200',
                i === step
                  ? 'bg-blue-600 scale-110'
                  : 'bg-gray-300 hover:bg-gray-400',
              )}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 pb-6">
          <button
            onClick={close}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            {t('onboarding.skip')}
          </button>

          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('onboarding.back')}
              </button>
            )}
            <button
              onClick={isLast ? close : () => setStep((s) => s + 1)}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isLast ? t('onboarding.start') : t('onboarding.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
