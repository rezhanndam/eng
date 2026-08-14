import { Package } from 'lucide-react';

export default function ProductsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
        <Package className="w-8 h-8 text-emerald-500" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Products</h1>
      <p className="text-slate-400 text-sm">Halaman ini sedang dalam pengembangan.</p>
    </div>
  );
}
