import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  action?: ToastAction;
  duration: number;
}

type Listener = () => void;

// Module-level state (no context needed)
let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export function toast(
  type: ToastType,
  message: string,
  opts?: { action?: ToastAction; duration?: number }
) {
  const item: ToastItem = {
    id: nextId++,
    type,
    message,
    action: opts?.action,
    duration: opts?.duration ?? 4000,
  };
  toasts = [...toasts, item];
  notify();
  return item.id;
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

function useToastStore() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
  return toasts;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} />,
  error: <AlertCircle size={18} />,
  info: <Info size={18} />,
  warning: <AlertTriangle size={18} />,
};

const colors: Record<ToastType, string> = {
  success: 'bg-emerald-50 border-emerald-300 text-emerald-800',
  error: 'bg-red-50 border-red-300 text-red-800',
  info: 'bg-blue-50 border-blue-300 text-blue-800',
  warning: 'bg-amber-50 border-amber-300 text-amber-800',
};

const iconColors: Record<ToastType, string> = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-amber-500',
};

function ToastCard({ item }: { item: ToastItem }) {
  useEffect(() => {
    if (item.duration <= 0) return;
    const timer = setTimeout(() => dismiss(item.id), item.duration);
    return () => clearTimeout(timer);
  }, [item.id, item.duration]);

  return (
    <div
      className={`flex items-start gap-2.5 px-4 py-3 rounded-lg border shadow-lg max-w-sm animate-toast-in ${colors[item.type]}`}
    >
      <span className={`mt-0.5 shrink-0 ${iconColors[item.type]}`}>{icons[item.type]}</span>
      <p className="text-sm flex-1">{item.message}</p>
      {item.action && (
        <button
          onClick={() => {
            item.action!.onClick();
            dismiss(item.id);
          }}
          className="text-xs font-semibold underline underline-offset-2 shrink-0 hover:opacity-80"
        >
          {item.action.label}
        </button>
      )}
      <button
        onClick={() => dismiss(item.id)}
        className="shrink-0 opacity-60 hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const items = useToastStore();
  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 print:hidden">
      {items.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  );
}
