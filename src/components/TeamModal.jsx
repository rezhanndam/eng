import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const GRADIENTS = [
  'from-blue-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
];

const generateMemberId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `mem-${crypto.randomUUID().slice(0, 4)}`;
  }
  return `mem-${Date.now().toString(36)}`;
};

export default function TeamModal({ isOpen, onClose, onSave, member = null }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Engineer');
  const [color, setColor] = useState(GRADIENTS[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (member) {
      setName(member.name);
      setRole(member.role);
      setColor(member.color || GRADIENTS[0]);
    } else {
      setName('');
      setRole('Engineer');
      setColor(GRADIENTS[0]);
    }
    setError('');
  }, [member, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: member ? member.id : generateMemberId(),
      name: name.trim(),
      role: role.trim(),
      color,
      avatar: name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
      activeTasks: member?.activeTasks ?? 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-[15px]">
            {member ? 'Edit Team Member' : 'Add Team Member'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Chen"
              className="w-full h-10 px-3 text-[13px] bg-slate-50 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Role / Title
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Mechanical Engineer"
              className="w-full h-10 px-3 text-[13px] bg-slate-50 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Avatar Color
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {GRADIENTS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setColor(g)}
                  className={`w-9 h-9 rounded-full bg-gradient-to-br ${g} transition-all cursor-pointer ${color === g ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-800 scale-110' : 'hover:scale-110'}`}
                  aria-label={`Select avatar color`}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-[12px] text-red-500 dark:text-red-400">{error}</p>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-[13px] font-medium border border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-4 text-[13px] font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
            >
              {member ? 'Save Changes' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
