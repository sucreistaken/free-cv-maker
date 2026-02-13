import { PenLine, Eye } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';

export function MobileTabBar() {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <div className="flex border-b border-gray-200 bg-white md:hidden">
      <button
        onClick={() => setActiveTab('editor')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
          activeTab === 'editor'
            ? 'text-primary border-b-2 border-primary'
            : 'text-gray-500 hover:text-gray-700'
        )}
      >
        <PenLine size={16} />
        Editor
      </button>
      <button
        onClick={() => setActiveTab('preview')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
          activeTab === 'preview'
            ? 'text-primary border-b-2 border-primary'
            : 'text-gray-500 hover:text-gray-700'
        )}
      >
        <Eye size={16} />
        Preview
      </button>
    </div>
  );
}
