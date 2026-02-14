import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Camera } from 'lucide-react';
import { toast } from '../ui/Toast';
import { useCVStore } from '../../store/useCVStore';
import { FormField } from './shared/FormField';
import { validateImageFile, resizeImage } from '../../utils/image';

export function PersonalInfoForm() {
  const { t } = useTranslation();
  const { personalInfo, updatePersonalInfo } = useCVStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validateImageFile(file);
    if (error) {
      toast('error', error);
      return;
    }
    try {
      const base64 = await resizeImage(file);
      updatePersonalInfo('profilePhoto', base64);
    } catch {
      toast('error', t('toast.imageError'));
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      {/* Profile Photo */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('personalInfoForm.profilePhoto')}</label>
        {personalInfo.profilePhoto ? (
          <div className="flex items-center gap-3">
            <img
              src={personalInfo.profilePhoto}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            />
            <button
              onClick={() => updatePersonalInfo('profilePhoto', '')}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
            >
              <X size={14} />
              {t('personalInfoForm.remove')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50"
          >
            <Camera size={14} />
            {t('personalInfoForm.uploadPhoto')}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      <FormField label={t('personalInfoForm.fullName')} value={personalInfo.fullName} onChange={(v) => updatePersonalInfo('fullName', v)} />
      <FormField label={t('personalInfoForm.jobTitle')} value={personalInfo.jobTitle} onChange={(v) => updatePersonalInfo('jobTitle', v)} placeholder={t('personalInfoForm.jobTitlePlaceholder')} />
      <FormField label={t('personalInfoForm.location')} value={personalInfo.location} onChange={(v) => updatePersonalInfo('location', v)} placeholder={t('personalInfoForm.locationPlaceholder')} />
      <FormField label={t('personalInfoForm.email')} value={personalInfo.email} onChange={(v) => updatePersonalInfo('email', v)} type="email" />
      <FormField label={t('personalInfoForm.phone')} value={personalInfo.phone} onChange={(v) => updatePersonalInfo('phone', v)} />
      <FormField label={t('personalInfoForm.linkedin')} value={personalInfo.linkedin} onChange={(v) => updatePersonalInfo('linkedin', v)} placeholder={t('personalInfoForm.linkedinPlaceholder')} />
      <FormField label={t('personalInfoForm.github')} value={personalInfo.github} onChange={(v) => updatePersonalInfo('github', v)} placeholder={t('personalInfoForm.githubPlaceholder')} />
      <FormField label={t('personalInfoForm.website')} value={personalInfo.website} onChange={(v) => updatePersonalInfo('website', v)} />
      <FormField label={t('personalInfoForm.nationality')} value={personalInfo.nationality} onChange={(v) => updatePersonalInfo('nationality', v)} placeholder={t('personalInfoForm.nationalityPlaceholder')} />
      <FormField label={t('personalInfoForm.drivingLicense')} value={personalInfo.drivingLicense} onChange={(v) => updatePersonalInfo('drivingLicense', v)} placeholder={t('personalInfoForm.drivingLicensePlaceholder')} />
    </div>
  );
}
