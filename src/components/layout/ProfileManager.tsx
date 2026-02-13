import { useState } from 'react';
import { Plus, Copy, Trash2, Pencil } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { useProfileStore } from '../../store/useProfileStore';
import { useCVStore } from '../../store/useCVStore';
import { useAppStore } from '../../store/useAppStore';

interface ProfileManagerProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileManager({ open, onClose }: ProfileManagerProps) {
  const { profiles, activeProfileId, createProfile, deleteProfile, renameProfile, switchProfile, duplicateProfile } = useProfileStore();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = () => {
    const name = newName.trim() || `Profile ${profiles.length + 1}`;
    createProfile(name);
    setNewName('');
    // Sync facade stores
    useCVStore.getState()._syncFromProfile();
    useAppStore.getState()._syncFromProfile();
  };

  const handleSwitch = (id: string) => {
    switchProfile(id);
    useCVStore.getState()._syncFromProfile();
    useAppStore.getState()._syncFromProfile();
  };

  const handleDuplicate = (id: string) => {
    duplicateProfile(id);
    useCVStore.getState()._syncFromProfile();
    useAppStore.getState()._syncFromProfile();
  };

  const handleDelete = (id: string) => {
    if (profiles.length <= 1) return;
    if (!confirm('Delete this profile?')) return;
    deleteProfile(id);
    useCVStore.getState()._syncFromProfile();
    useAppStore.getState()._syncFromProfile();
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      renameProfile(id, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <Dialog open={open} onClose={onClose} title="Manage Profiles">
      <div className="space-y-3">
        {/* Create new */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New profile name..."
            className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button variant="primary" size="sm" onClick={handleCreate}>
            <Plus size={14} />
            Create
          </Button>
        </div>

        <div className="border-t border-gray-100" />

        {/* Profile list */}
        <div className="space-y-2">
          {profiles.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${
                p.id === activeProfileId
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50 cursor-pointer'
              }`}
              onClick={() => p.id !== activeProfileId && handleSwitch(p.id)}
            >
              <div className="flex-1 min-w-0">
                {editingId === p.id ? (
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleRename(p.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename(p.id)}
                    className="text-sm w-full border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-400">
                      Updated {new Date(p.updatedAt).toLocaleDateString()}
                    </p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => { setEditingId(p.id); setEditName(p.name); }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                  title="Rename"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => handleDuplicate(p.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                  title="Duplicate"
                >
                  <Copy size={13} />
                </button>
                {profiles.length > 1 && (
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Dialog>
  );
}
