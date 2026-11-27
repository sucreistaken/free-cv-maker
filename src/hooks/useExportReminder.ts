import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '../components/ui/Toast';
import { downloadCvBackup } from '../utils/backup';
import { useCVStore } from '../store/useCVStore';

const STORAGE_KEY = 'nextcv-export-reminder';
/**
 * Store changes fire on every keystroke, so 20 raw changes meant a reminder after one
 * sentence. Count at most one change per TICK_MS instead: 40 ticks is about ten
 * minutes of actual editing.
 */
const MAX_CHANGES = 40;
const TICK_MS = 15_000;
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
  const lastTickRef = useRef(0);

  useEffect(() => {
    let unsub = () => {};
    // App loads the active profile into the store in an effect that runs after this one.
    // Subscribing a tick later keeps that load from counting as an edit; otherwise a CV
    // last backed up a day ago showed the reminder the moment the page opened.
    const start = setTimeout(() => {
      unsub = useCVStore.subscribe(onChange);
    }, 0);

    function onChange() {
      const now = Date.now();
      if (now - lastTickRef.current < TICK_MS) return;
      lastTickRef.current = now;
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
              downloadCvBackup();
              markExported();
            },
          },
          duration: 8000,
        });
        setTimeout(() => { shownRef.current = false; }, MAX_AGE_MS);
      }
    }

    return () => {
      clearTimeout(start);
      unsub();
    };
  }, [t]);
}
