import { useEffect, useState } from 'react';
import { categoryApi } from '@jizhang/shared';
import type { Category } from '@jizhang/shared';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tab, setTab] = useState<'expense' | 'income'>('expense');
  const [showForm, setShowForm] = useState(false);

  const load = async () => setCategories(await categoryApi.list());
  useEffect(() => { load(); }, []);

  const filtered = categories.filter((c) => c.type === tab);

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除？')) return;
    try {
      await categoryApi.remove(id);
      load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold">分类管理</h1>
        <button className="btn-primary text-sm" onClick={() => setShowForm(true)}>+ 新增</button>
      </div>

      <div className="flex gap-2">
        {(['expense', 'income'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t ? 'bg-primary-500 text-white' : 'bg-white text-gray-500 border border-gray-200'
            }`}>
            {t === 'expense' ? '支出分类' : '收入分类'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {filtered.map((c) => (
          <div key={c.id} className="card flex flex-col items-center gap-1 py-3 relative">
            <span className="text-3xl">{c.icon}</span>
            <span className="text-xs text-gray-600 text-center">{c.name}</span>
            <button onClick={() => handleDelete(c.id)}
              className="absolute top-1 right-1 text-gray-300 hover:text-red-400 text-xs leading-none">×</button>
          </div>
        ))}
      </div>

      {showForm && (
        <CategoryForm type={tab} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
      )}
    </div>
  );
}

function CategoryForm({ type, onClose, onSaved }: {
  type: 'income' | 'expense';
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState('#6B7280');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await categoryApi.create({ name, type, icon, color });
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end z-50" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl mx-auto rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">新增{type === 'expense' ? '支出' : '收入'}分类</h2>
          <button onClick={onClose} className="text-gray-400">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input required placeholder="分类名称" value={name} onChange={(e) => setName(e.target.value)} className="input" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">图标 (emoji)</label>
              <input value={icon} onChange={(e) => setIcon(e.target.value)} className="input text-2xl" maxLength={2} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">颜色</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="input h-10 p-1 cursor-pointer" />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full py-3">保存</button>
        </form>
      </div>
    </div>
  );
}
