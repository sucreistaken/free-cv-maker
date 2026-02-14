import { useTranslation } from 'react-i18next';
import { useCVStore } from '../../store/useCVStore';
import { FormField } from './shared/FormField';

export function CoverLetterForm() {
  const { t } = useTranslation();
  const { coverLetterData, updateCoverLetter } = useCVStore();

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-sm font-semibold text-gray-800 mb-2">{t('coverLetterForm.title')}</h2>

      <FormField
        label={t('coverLetterForm.recipientName')}
        value={coverLetterData.recipientName}
        onChange={(v) => updateCoverLetter('recipientName', v)}
        placeholder={t('coverLetterForm.recipientNamePlaceholder')}
      />
      <FormField
        label={t('coverLetterForm.recipientTitle')}
        value={coverLetterData.recipientTitle}
        onChange={(v) => updateCoverLetter('recipientTitle', v)}
        placeholder={t('coverLetterForm.recipientTitlePlaceholder')}
      />
      <FormField
        label={t('coverLetterForm.company')}
        value={coverLetterData.company}
        onChange={(v) => updateCoverLetter('company', v)}
        placeholder={t('coverLetterForm.companyPlaceholder')}
      />
      <FormField
        label={t('coverLetterForm.address')}
        value={coverLetterData.address}
        onChange={(v) => updateCoverLetter('address', v)}
        placeholder={t('coverLetterForm.addressPlaceholder')}
      />
      <FormField
        label={t('coverLetterForm.date')}
        value={coverLetterData.date}
        onChange={(v) => updateCoverLetter('date', v)}
      />
      <FormField
        label={t('coverLetterForm.greeting')}
        value={coverLetterData.greeting}
        onChange={(v) => updateCoverLetter('greeting', v)}
        placeholder={t('coverLetterForm.greetingPlaceholder')}
      />

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{t('coverLetterForm.body')}</label>
        <textarea
          value={coverLetterData.body}
          onChange={(e) => updateCoverLetter('body', e.target.value)}
          placeholder={t('coverLetterForm.bodyPlaceholder')}
          rows={10}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-y"
        />
      </div>

      <FormField
        label={t('coverLetterForm.closing')}
        value={coverLetterData.closing}
        onChange={(v) => updateCoverLetter('closing', v)}
        placeholder={t('coverLetterForm.closingPlaceholder')}
      />
      <FormField
        label={t('coverLetterForm.signature')}
        value={coverLetterData.signature}
        onChange={(v) => updateCoverLetter('signature', v)}
        placeholder={t('coverLetterForm.signaturePlaceholder')}
      />
    </div>
  );
}
