import { create } from 'zustand';

interface EditorFocusStore {
  /** Section the editor should open and scroll to. `nonce` lets the same section be requested twice. */
  target: { sectionId: string; nonce: number } | null;
  focusSection: (sectionId: string) => void;
}

export const useEditorFocusStore = create<EditorFocusStore>((set) => ({
  target: null,
  focusSection: (sectionId) => set({ target: { sectionId, nonce: Date.now() } }),
}));
