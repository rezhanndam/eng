import { useRef, useState } from 'react';
import { Database, Download, Upload, ShieldCheck, AlertTriangle } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../hooks/useToast';

// Saves a full workspace snapshot to a JSON file and restores it from one.
// Cloud documents keep only their storage path (the file stays in Supabase),
// local documents embed their base64 content directly in the backup.
export default function DataPage({ data = {}, onImport }) {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [pendingImport, setPendingImport] = useState(null);

  const counts = {
    projects: (data.projects || []).length,
    tasks: (data.tasks || []).length,
    documents: (data.documents || []).length,
    team: (data.teamMembers || []).length,
  };

  const handleExport = () => {
    const backup = {
      app: 'EngDesk',
      version: 1,
      exportedAt: new Date().toISOString(),
      data,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `engdesk-backup-${new Date().toISOString().slice(0, 10)}.json`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Backup file downloaded.');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const inner = parsed?.data && typeof parsed.data === 'object' && 'app' in parsed ? parsed.data : parsed;
        const valid = ['projects', 'tasks', 'documents', 'categories', 'teamMembers', 'activity', 'dailyReports', 'trash']
          .some((key) => Array.isArray(inner[key]) || (typeof inner[key] === 'object' && inner[key] !== null));
        if (!valid) {
          showToast('Invalid backup file. Please choose a valid EngDesk backup JSON.', 'error');
          return;
        }
        setPendingImport(inner);
      } catch {
        showToast('Invalid file. Please choose a valid EngDesk backup JSON.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    onImport(pendingImport);
    setPendingImport(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <Database className="w-6 h-6 text-blue-500" />
          Data Backup
        </h1>
        <p className="text-[13.5px] text-slate-400 dark:text-slate-500 mt-1">
          Export all your workspace data as a JSON file, or restore it from a previous backup.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {[['Projects', counts.projects], ['Tasks', counts.tasks], ['Documents', counts.documents], ['Team', counts.team]].map(([label, value]) => (
            <div key={label} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center justify-center gap-2 h-12 text-[13.5px] font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export All Data
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 h-12 text-[13.5px] font-semibold border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Import Backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      <div className="bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-4 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
        <p className="text-[12.5px] text-emerald-700 dark:text-emerald-300">
          Backup berisi semua data workspace Anda. Di mode cloud, file dokumen tidak disertakan di dalam file backup —
          referensi penyimpanannya tetap ada selama file aslinya tidak dihapus permanen dari storage.
        </p>
      </div>

      <div className="bg-amber-50/50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
        <p className="text-[12.5px] text-amber-700 dark:text-amber-300">
          Restore akan <strong>mengganti seluruh data saat ini</strong>. Pastikan Anda mengekspor backup terbaru sebelum
          melakukan restore.
        </p>
      </div>

      <ConfirmModal
        isOpen={!!pendingImport}
        onClose={() => setPendingImport(null)}
        onConfirm={handleConfirmImport}
        title="Restore backup"
        message="Semua data saat ini akan digantikan oleh isi file backup. Lanjutkan?"
        confirmLabel="Restore"
      />
    </div>
  );
}