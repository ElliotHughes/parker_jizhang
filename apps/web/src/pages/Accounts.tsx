import { useEffect, useState } from 'react';
import { accountApi, formatAmount, ACCOUNT_TYPE_LABELS } from '@jizhang/shared';
import type { Account } from '@jizhang/shared';

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);

  const load = async () => setAccounts(await accountApi.list());

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除此账户？')) return;
    try {
      await accountApi.remove(id);
      load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold">我的账户</h1>
        <button className="btn-primary text-sm" onClick={() => setShowForm(true)}>+ 新增</button>
      </div>

      <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-4 text-white">
        <p className="text-xs opacity-80">总资产</p>
        <p className="text-2xl font-bold">¥{formatAmount(totalBalance)}</p>
      </div>

      <div className="space-y-2">
        {accounts.map((acc) => (
          <div key={acc.id} className="card flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: acc.color ? acc.color + '20' : '#f3f4f6' }}>
              {acc.icon || '💰'}
            </div>
            <div className="flex-1">
              <p className="font-medium">{acc.name}</p>
              <p className="text-xs text-gray-400">{ACCOUNT_TYPE_LABELS[acc.type]}</p>
            </div>
            <div className="text-right">
              <p className={`font-bold ${acc.balance >= 0 ? 'text-gray-800' : 'text-expense'}`}>
                ¥{formatAmount(acc.balance)}
              </p>
            </div>
            <button onClick={() => handleDelete(acc.id)} className="text-gray-300 hover:text-red-400 ml-2">✕</button>
          </div>
        ))}
      </div>

      {showForm && (
        <AccountForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
      )}
    </div>
  );
}

function AccountForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('cash');
  const [balance, setBalance] = useState('0');
  const [icon, setIcon] = useState('💰');
  const [color, setColor] = useState('#22c55e');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await accountApi.create({ name, type: type as any, balance: parseFloat(balance), icon, color });
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end z-50" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl mx-auto rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">新增账户</h2>
          <button onClick={onClose} className="text-gray-400">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">账户名称 *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="如：工商银行" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">类型</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="input">
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">初始余额</label>
              <input type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">图标</label>
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
