import { useRef } from 'react';
import { X, Camera } from 'lucide-react';
import { useCVStore } from '../../store/useCVStore';
import { FormField } from './shared/FormField';
import { validateImageFile, resizeImage } from '../../utils/image';

export function PersonalInfoForm() {
  const { personalInfo, updatePersonalInfo } = useCVStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validateImageFile(file);
    if (error) {
      alert(error);
      return;
    }
    try {
      const base64 = await resizeImage(file);
      updatePersonalInfo('profilePhoto', base64);
    } catch {
      alert('Failed to process image.');
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      {/* Profile Photo */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Profile Photo</label>
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
              Remove
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50"
          >
            <Camera size={14} />
            Upload Photo
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

      <FormField label="Full Name" value={personalInfo.fullName} onChange={(v) => updatePersonalInfo('fullName', v)} />
      <FormField label="Job Title" value={personalInfo.jobTitle} onChange={(v) => updatePersonalInfo('jobTitle', v)} placeholder="e.g. Software Engineer" />
      <FormField label="Location" value={personalInfo.location} onChange={(v) => updatePersonalInfo('location', v)} placeholder="e.g. Istanbul, Turkey" />
      <FormField label="Email" value={personalInfo.email} onChange={(v) => updatePersonalInfo('email', v)} type="email" />
      <FormField label="Phone" value={personalInfo.phone} onChange={(v) => updatePersonalInfo('phone', v)} />
      <FormField label="LinkedIn" value={personalInfo.linkedin} onChange={(v) => updatePersonalInfo('linkedin', v)} placeholder="e.g. in/username" />
      <FormField label="GitHub" value={personalInfo.github} onChange={(v) => updatePersonalInfo('github', v)} placeholder="e.g. github.com/username" />
      <FormField label="Website" value={personalInfo.website} onChange={(v) => updatePersonalInfo('website', v)} />
      <FormField label="Nationality" value={personalInfo.nationality} onChange={(v) => updatePersonalInfo('nationality', v)} placeholder="e.g. Turkish" />
      <FormField label="Driving License" value={personalInfo.drivingLicense} onChange={(v) => updatePersonalInfo('drivingLicense', v)} placeholder="e.g. B" />
    </div>
  );
}
