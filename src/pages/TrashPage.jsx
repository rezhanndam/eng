import { useState } from 'react';
import {
  FolderKanban,
  ListChecks,
  FileText,
  Users,
  Activity,
  Trash2,
  RotateCcw,
  Trash,
  XCircle,
} from 'lucide-react';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';

const TYPE_META = {
  project: { icon: FolderKanban, label: 'Project' },
  task: { icon: ListChecks, label: 'Task' },
  document: { icon: FileText, label: 'Document' },
  member: { icon: Users, label: 'Team Member' },
  daily: { icon: Activity, label: 'Daily Report' },
};

const entryName = (entry) => entry.item?.name || entry.item?.task || entry.item?.dateVal || entry.id;

const entryDetail = (entry) => {
  if (entry.type === 'task') return entry.item?.project || '';
  if (entry.type === 'document') return [entry.item?.type, entry.item?.category].filter(Boolean).join(' · ');
  if (entry.type === 'daily') return entry.item?.projectId || '';
  return '';
};

export default function TrashPage({ trash = [], onRestore, onPermanentDelete, onEmptyTrash, can }) {
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingEmpty, setPendingEmpty] = useState(false);

  const canManage = (type) => {
    if (type === 'project' || type === 'member') return can('project.manage') || can('team.manage');
    return can('task.create') || can('project.manage');
  };

  const canEmpty = can('project.manage') || can('team.manage');

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Trash</h1>
          <p className="text-[13.5px] text-slate-400 dark:text-slate-500 mt-1">
            {trash.length === 0
              ? 'Items you delete are moved here and can be restored.'
              : `${trash.length} deleted item${trash.length > 1 ? 's' : ''}. Files are kept until permanently deleted.`}
          </p>
        </div>
        {canEmpty && trash.length > 0 && (
          <button
            onClick={() => setPendingEmpty(true)}
            className="flex items-center gap-2 h-9 px-4 text-[13px] font-medium bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            Empty Trash
          </button>
        )}
      </div>

      {trash.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <EmptyState
            icon={Trash2}
            title="Trash is empty"
            description="Deleted projects, tasks, documents, team members and daily reports will appear here so you can restore them."
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {trash.map((entry) => {
              const meta = TYPE_META[entry.type] || { icon: Trash2, label: entry.type };
              const Icon = meta.icon;
              const detail = entryDetail(entry);
              const allowed = canManage(entry.type);
              return (
                <div key={`${entry.type}:${entry.id}`} className="flex items-center gap-4 py-3.5">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-medium text-slate-800 dark:text-slate-100 truncate">{entryName(entry)}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                      <span className="font-semibold">{meta.label}</span>
                      {detail && (
                        <>
                          <span>&middot;</span>
                          <span className="truncate">{detail}</span>
                        </>
                      )}
                      <span>&middot;</span>
                      <span>{new Date(entry.deletedAt || Date.now()).toLocaleString()}</span>
                    </div>
                  </div>
                  {allowed && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onRestore(entry)}
                        className="flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                        title="Restore"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore
                      </button>
                      <button
                        onClick={() => setPendingDelete(entry)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete forever"
                        aria-label={`Delete forever ${entryName(entry)}`}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          onPermanentDelete(pendingDelete);
          setPendingDelete(null);
        }}
        title="Delete forever?"
        message={`"${pendingDelete ? entryName(pendingDelete) : ''}" will be permanently removed and cannot be restored.`}
        confirmLabel="Delete Forever"
      />

      <ConfirmModal
        isOpen={pendingEmpty}
        onClose={() => setPendingEmpty(false)}
        onConfirm={() => {
          onEmptyTrash();
          setPendingEmpty(false);
        }}
        title="Empty trash?"
        message="All items in the trash will be permanently deleted. This cannot be undone."
        confirmLabel="Empty Trash"
      />
    </div>
  );
}
