import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '../components/ui/Toast';
import { useCVStore } from '../store/useCVStore';

const STORAGE_KEY = 'nextcv-export-reminder';
const MAX_CHANGES = 20;
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface ReminderState {
  lastExport: number;
  changeCount: number;
}

function getState(): ReminderState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { lastExport: Date.now(), changeCount: 0 };
}

function saveState(state: ReminderState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function markExported() {
  saveState({ lastExport: Date.now(), changeCount: 0 });
}

export function useExportReminder() {
  const { t } = useTranslation();
  const shownRef = useRef(false);

  useEffect(() => {
    const unsub = useCVStore.subscribe(() => {
      const state = getState();
      state.changeCount++;
      saveState(state);

      if (shownRef.current) return;

      const age = Date.now() - state.lastExport;
      if (state.changeCount >= MAX_CHANGES || age >= MAX_AGE_MS) {
        shownRef.current = true;
        toast('info', t('toast.backupReminder'), {
          action: {
            label: t('toast.backupNow'),
            onClick: () => {
              document.querySelector<HTMLButtonElement>('[title="Export JSON"], [title="JSON Dışa Aktar"]')?.click();
              markExported();
            },
          },
          duration: 8000,
        });
        setTimeout(() => { shownRef.current = false; }, MAX_AGE_MS);
      }
    });

    return unsub;
  }, [t]);
}
