import { useEffect, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import { useStore } from '../store/useStore';
import { formatAmount, transactionApi } from '@jizhang/shared';
import type { Transaction } from '@jizhang/shared';

type TxType = 'all' | 'income' | 'expense' | 'transfer';

export default function Transactions() {
  const { accounts, categories, fetchAccounts, fetchCategories, createTransaction } = useStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<TxType>('all');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async (p = 1) => {
    const params: Record<string, string | number> = { page: p, limit: 20 };
    if (filterType !== 'all') params.type = filterType;
    const res = await transactionApi.list(params);
    setTransactions(res.data);
    setTotal(res.total);
    setPage(p);
  }, [filterType]);

  useEffect(() => { load(1); }, [load]);
  useEffect(() => { fetchAccounts(); fetchCategories(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除该记录？')) return;
    await transactionApi.remove(id);
    load(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold">交易记录</h1>
        <button className="btn-primary text-sm" onClick={() => setShowForm(true)}>+ 记一笔</button>
      </div>

      {/* 类型筛选 */}
      <div className="flex gap-2">
        {(['all', 'income', 'expense', 'transfer'] as TxType[]).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterType === t ? 'bg-primary-500 text-white' : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {{ all: '全部', income: '收入', expense: '支出', transfer: '转账' }[t]}
          </button>
        ))}
      </div>

      {/* 交易列表 */}
      <div className="card space-y-1">
        {transactions.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">暂无记录</p>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{tx.category_icon || '📦'}</span>
                <div>
                  <p className="text-sm font-medium">{tx.category_name || '转账'}</p>
                  <p className="text-xs text-gray-400">{tx.date} · {tx.account_name}{tx.note ? ` · ${tx.note}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-income' : tx.type === 'expense' ? 'text-expense' : 'text-transfer'}`}>
                  {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '≈'}¥{formatAmount(tx.amount)}
                </span>
                <button onClick={() => handleDelete(tx.id)} className="text-gray-300 hover:text-red-400 text-sm">✕</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 分页 */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => load(page - 1)} className="btn-ghost text-sm disabled:opacity-40">上一页</button>
          <span className="text-sm text-gray-500 py-2">{page} / {Math.ceil(total / 20)}</span>
          <button disabled={page >= Math.ceil(total / 20)} onClick={() => load(page + 1)} className="btn-ghost text-sm disabled:opacity-40">下一页</button>
        </div>
      )}

      {/* 新增弹窗 */}
      {showForm && (
        <TransactionForm
          accounts={accounts}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(1); }}
          onSubmit={createTransaction}
        />
      )}
    </div>
  );
}

function TransactionForm({ accounts, categories, onClose, onSaved, onSubmit }: {
  accounts: any[];
  categories: any[];
  onClose: () => void;
  onSaved: () => void;
  onSubmit: (data: any) => Promise<void>;
}) {
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id?.toString() || '');
  const [toAccountId, setToAccountId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [saving, setSaving] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountId) return;
    setSaving(true);
    try {
      await onSubmit({
        type,
        amount: parseFloat(amount),
        category_id: categoryId ? parseInt(categoryId) : undefined,
        account_id: parseInt(accountId),
        to_account_id: toAccountId ? parseInt(toAccountId) : undefined,
        note,
        date,
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end z-50" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl mx-auto rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">记一笔</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 类型选择 */}
          <div className="flex gap-2">
            {(['expense', 'income', 'transfer'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  type === t
                    ? t === 'income' ? 'bg-income text-white' : t === 'expense' ? 'bg-expense text-white' : 'bg-transfer text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                {{ expense: '支出', income: '收入', transfer: '转账' }[t]}
              </button>
            ))}
          </div>

          {/* 金额 */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">金额 *</label>
            <input type="number" step="0.01" min="0.01" required placeholder="0.00"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              className="input text-2xl font-bold h-14" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* 账户 */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{type === 'transfer' ? '转出账户' : '账户'} *</label>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="input" required>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
              </select>
            </div>

            {/* 分类 / 转入账户 */}
            {type === 'transfer' ? (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">转入账户 *</label>
                <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} className="input" required>
                  <option value="">请选择</option>
                  {accounts.filter((a) => a.id.toString() !== accountId).map((a) => (
                    <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">分类</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input">
                  <option value="">不选分类</option>
                  {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
            )}

            {/* 日期 */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">日期 *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" required />
            </div>

            {/* 备注 */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">备注</label>
              <input type="text" placeholder="可选" value={note} onChange={(e) => setNote(e.target.value)} className="input" />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full py-3 text-base disabled:opacity-60">
            {saving ? '保存中...' : '保存'}
          </button>
        </form>
      </div>
    </div>
  );
}
