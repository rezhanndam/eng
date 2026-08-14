import { Users } from 'lucide-react';

export default function CustomersPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
        <Users className="w-8 h-8 text-violet-500" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Customers</h1>
      <p className="text-slate-400 text-sm">Halaman ini sedang dalam pengembangan.</p>
    </div>
  );
}
