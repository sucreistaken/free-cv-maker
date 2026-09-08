import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, ChevronDown, ExternalLink, CircleAlert, TriangleAlert, Sparkles } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { toast } from '../ui/Toast';
import { useAppStore } from '../../store/useAppStore';
import { useCVStore } from '../../store/useCVStore';
import { copyToClipboard } from '../../utils/clipboard';
import { getAIPrompt, type PromptLanguage } from '../../utils/aiPrompt';
import { parseAIResponse, cvHasContent, type AIParseFailureReason } from '../../utils/aiImport';
import { logEvent } from '../../utils/cloudSync';

interface AIAssistModalProps {
  open: boolean;
  onClose: () => void;
}

const ERROR_KEY: Record<AIParseFailureReason, string> = {
  empty: 'ai.errorEmpty',
  'no-json': 'ai.errorNoJson',
  'invalid-json': 'ai.errorInvalidJson',
  'not-cv-shaped': 'ai.errorNotCvShaped',
};

export function AIAssistModal({ open, onClose }: AIAssistModalProps) {
  const { t } = useTranslation();
  const uiLanguage = useAppStore((s) => s.language) as PromptLanguage;
  const loadFromImport = useCVStore((s) => s.loadFromImport);

  const [outputLanguage, setOutputLanguage] = useState<PromptLanguage>('en');
  const [copied, setCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [pasted, setPasted] = useState('');
  const [error, setError] = useState<AIParseFailureReason | null>(null);

  const prompt = getAIPrompt(uiLanguage, outputLanguage);

  useEffect(() => {
    if (open) logEvent('ai_opened');
  }, [open]);

  const handleCopy = async () => {
    const ok = await copyToClipboard(prompt);
    if (ok) {
      setCopied(true);
      toast('success', t('ai.copySuccessToast'));
      logEvent('ai_prompt_copied', { data: { outputLanguage } });
      setTimeout(() => setCopied(false), 1800);
    } else {
      toast('error', t('ai.copyErrorToast'));
      setShowPrompt(true);
    }
  };

  const handleApply = () => {
    const result = parseAIResponse(pasted);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    if (cvHasContent(useCVStore.getState()) && !confirm(t('ai.overwriteConfirm'))) {
      return;
    }
    setError(null);
    loadFromImport(result.data);
    toast('success', t('ai.successToast'));
    logEvent('ai_applied', { cvSnapshot: result.data });
    setPasted('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title={t('ai.modalTitle')} size="xl">
      <p className="text-xs text-gray-500 mb-4">{t('ai.intro')}</p>

      <div className="pb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-none w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">1</div>
          <p className="text-sm font-semibold text-gray-900">{t('ai.step1Title')}</p>
        </div>
        <p className="text-xs text-gray-500 mb-3 ml-8">{t('ai.step1Desc')}</p>

        <div className="ml-8 flex items-center gap-2 flex-wrap bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-3">
          <span className="text-xs font-semibold text-gray-700">{t('ai.outputLangLabel')}</span>
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => setOutputLanguage('en')}
              className={`px-2.5 py-1 text-xs font-semibold transition-colors ${outputLanguage === 'en' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setOutputLanguage('tr')}
              className={`px-2.5 py-1 text-xs font-semibold border-l border-gray-300 transition-colors ${outputLanguage === 'tr' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Türkçe
            </button>
          </div>
          <span className="text-[10px] text-gray-400 basis-full">{t('ai.outputLangHint')}</span>
        </div>

        <div className="ml-8">
          <Button
            variant="primary"
            size="sm"
            onClick={handleCopy}
            className={copied ? 'bg-green-600 hover:bg-green-600 focus:ring-green-500' : ''}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? t('ai.copyButtonCopied') : t('ai.copyButton')}
          </Button>
          <button
            type="button"
            onClick={() => setShowPrompt((v) => !v)}
            className="ml-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark"
          >
            {t('ai.viewPromptToggle')}
            <ChevronDown size={12} className={`transition-transform ${showPrompt ? 'rotate-180' : ''}`} />
          </button>
          {showPrompt && (
            <pre className="mt-2 bg-gray-900 text-blue-100 rounded-lg p-3 text-[11px] leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap break-words">
              {prompt}
            </pre>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-none w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">2</div>
          <p className="text-sm font-semibold text-gray-900">{t('ai.step2Title')}</p>
        </div>
        <p className="text-xs text-gray-500 mb-3 ml-8">{t('ai.step2Desc')}</p>
        <div className="ml-8">
          <a
            href="https://chatgpt.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <ExternalLink size={13} />
            {t('ai.openChatGPTButton')}
          </a>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-none w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">3</div>
          <p className="text-sm font-semibold text-gray-900">{t('ai.step3Title')}</p>
        </div>
        <p className="text-xs text-gray-500 ml-8">{t('ai.step3Desc')}</p>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-none w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">4</div>
          <p className="text-sm font-semibold text-gray-900">{t('ai.step4Title')}</p>
        </div>
        <p className="text-xs text-gray-500 mb-3 ml-8">{t('ai.step4Desc')}</p>

        <div className="ml-8">
          <textarea
            value={pasted}
            onChange={(e) => {
              setPasted(e.target.value);
              if (error) setError(null);
            }}
            placeholder={t('ai.textareaPlaceholder')}
            className="w-full min-h-[100px] border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {error && (
            <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <CircleAlert size={14} className="flex-none text-red-600 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-800">{t(ERROR_KEY[error])}</p>
                <p className="text-[11px] text-red-600 mt-1">{t('ai.retryHint')}</p>
              </div>
            </div>
          )}

          <div className="mt-2 flex items-start gap-1.5 text-[11px] text-amber-700">
            <TriangleAlert size={12} className="flex-none mt-0.5" />
            <span>{t('ai.overwriteWarning')}</span>
          </div>

          <div className="mt-3">
            <Button variant="primary" size="sm" onClick={handleApply} disabled={!pasted.trim()}>
              <Sparkles size={14} />
              {t('ai.applyButton')}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
