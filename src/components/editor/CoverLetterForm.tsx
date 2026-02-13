import { useCVStore } from '../../store/useCVStore';
import { FormField } from './shared/FormField';

export function CoverLetterForm() {
  const { coverLetterData, updateCoverLetter } = useCVStore();

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-sm font-semibold text-gray-800 mb-2">Cover Letter</h2>

      <FormField
        label="Recipient Name"
        value={coverLetterData.recipientName}
        onChange={(v) => updateCoverLetter('recipientName', v)}
        placeholder="e.g. John Smith"
      />
      <FormField
        label="Recipient Title"
        value={coverLetterData.recipientTitle}
        onChange={(v) => updateCoverLetter('recipientTitle', v)}
        placeholder="e.g. Hiring Manager"
      />
      <FormField
        label="Company"
        value={coverLetterData.company}
        onChange={(v) => updateCoverLetter('company', v)}
        placeholder="e.g. Acme Inc."
      />
      <FormField
        label="Address"
        value={coverLetterData.address}
        onChange={(v) => updateCoverLetter('address', v)}
        placeholder="e.g. 123 Main St, City"
      />
      <FormField
        label="Date"
        value={coverLetterData.date}
        onChange={(v) => updateCoverLetter('date', v)}
      />
      <FormField
        label="Greeting"
        value={coverLetterData.greeting}
        onChange={(v) => updateCoverLetter('greeting', v)}
        placeholder="Dear Hiring Manager,"
      />

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Body</label>
        <textarea
          value={coverLetterData.body}
          onChange={(e) => updateCoverLetter('body', e.target.value)}
          placeholder="Write your cover letter content here..."
          rows={10}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-y"
        />
      </div>

      <FormField
        label="Closing"
        value={coverLetterData.closing}
        onChange={(v) => updateCoverLetter('closing', v)}
        placeholder="Sincerely,"
      />
      <FormField
        label="Signature (Name)"
        value={coverLetterData.signature}
        onChange={(v) => updateCoverLetter('signature', v)}
        placeholder="Your full name"
      />
    </div>
  );
}
