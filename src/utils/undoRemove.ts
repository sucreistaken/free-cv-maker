import i18n from '../i18n';
import { toast } from '../components/ui/Toast';
import { useCVStore } from '../store/useCVStore';

/** Built-in sections whose entries live in a top-level CV list. */
export type EntryListKey =
  | 'experience'
  | 'projects'
  | 'education'
  | 'involvement'
  | 'skills'
  | 'certifications'
  | 'languages'
  | 'awards'
  | 'references';

const UNDO_MS = 8000;

/** Puts `entry` back at `index` unless it is already there (a second undo click). */
export function insertAt<T extends { id: string }>(list: T[], entry: T, index: number): T[] {
  if (list.some((e) => e.id === entry.id)) return list;
  const at = Math.min(Math.max(index, 0), list.length);
  return [...list.slice(0, at), entry, ...list.slice(at)];
}

function offerUndo(restore: () => void) {
  toast('info', i18n.t('entryCard.removed'), {
    duration: UNDO_MS,
    action: { label: i18n.t('customSectionForm.undo'), onClick: restore },
  });
}

/** Deletes an entry right away (no confirm dialog) and offers a short-lived undo. */
export function removeEntryWithUndo(key: EntryListKey, id: string) {
  const store = useCVStore.getState();
  const list = store[key] as { id: string }[];
  const index = list.findIndex((e) => e.id === id);
  if (index < 0) return;
  const entry = list[index];

  const remove: Record<EntryListKey, (id: string) => void> = {
    experience: store.removeExperience,
    projects: store.removeProject,
    education: store.removeEducation,
    involvement: store.removeInvolvement,
    skills: store.removeSkillCategory,
    certifications: store.removeCertification,
    languages: store.removeLanguage,
    awards: store.removeAward,
    references: store.removeReference,
  };
  const reorder: Record<EntryListKey, (entries: never[]) => void> = {
    experience: store.reorderExperience,
    projects: store.reorderProjects,
    education: store.reorderEducation,
    involvement: store.reorderInvolvement,
    skills: store.reorderSkills,
    certifications: store.reorderCertifications,
    languages: store.reorderLanguages,
    awards: store.reorderAwards,
    references: store.reorderReferences,
  };

  remove[key](id);
  offerUndo(() => {
    const current = useCVStore.getState()[key] as { id: string }[];
    reorder[key](insertAt(current, entry, index) as never[]);
  });
}

/** Same as `removeEntryWithUndo`, for an entry of a section the user added. */
export function removeCustomEntryWithUndo(sectionId: string, entryId: string) {
  const { sections, removeCustomEntry } = useCVStore.getState();
  const items = sections.find((s) => s.id === sectionId)?.items ?? [];
  const index = items.findIndex((e) => e.id === entryId);
  if (index < 0) return;
  const entry = items[index];

  removeCustomEntry(sectionId, entryId);
  offerUndo(() => {
    const state = useCVStore.getState();
    const current = state.sections.find((s) => s.id === sectionId)?.items;
    if (current) state.reorderCustomEntries(sectionId, insertAt(current, entry, index));
  });
}
