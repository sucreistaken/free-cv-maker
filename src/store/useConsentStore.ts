import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ConsentStatus = 'pending' | 'accepted' | 'declined';

interface ConsentStore {
  status: ConsentStatus;
  decidedAt: string | null;
  accept: () => void;
  decline: () => void;
  reset: () => void;
}

export const useConsentStore = create<ConsentStore>()(
  persist(
    (set) => ({
      status: 'pending',
      decidedAt: null,
      accept: () => set({ status: 'accepted', decidedAt: new Date().toISOString() }),
      decline: () => set({ status: 'declined', decidedAt: new Date().toISOString() }),
      reset: () => set({ status: 'pending', decidedAt: null }),
    }),
    {
      name: 'cv-builder-consent',
    }
  )
);
