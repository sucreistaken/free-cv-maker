import { Plus } from 'lucide-react';
import { useCVStore } from '../../store/useCVStore';
import { ProjectEntryForm } from './ProjectEntryForm';
import { EntryCard } from './shared/EntryCard';
import { SortableList } from './SectionReorder';

export function ProjectsForm() {
  const { projects, addProject, removeProject, reorderProjects } = useCVStore();

  return (
    <div className="space-y-2">
      <SortableList
        items={projects}
        onReorder={reorderProjects}
        renderItem={(entry, dragHandleProps) => (
          <EntryCard
            title={entry.name}
            subtitle={entry.link}
            onRemove={() => removeProject(entry.id)}
            dragHandleProps={dragHandleProps}
          >
            <ProjectEntryForm entry={entry} />
          </EntryCard>
        )}
      />
      <button
        type="button"
        onClick={addProject}
        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark font-medium w-full justify-center py-2 border border-dashed border-gray-300 rounded-lg hover:border-primary/50 transition-colors"
      >
        <Plus size={16} />
        Add Project
      </button>
    </div>
  );
}
