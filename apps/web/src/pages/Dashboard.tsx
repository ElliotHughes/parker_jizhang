import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { useStore } from '../store/useStore';
import { formatAmount, TRANSACTION_TYPE_LABELS } from '@jizhang/shared';
import type { Transaction } from '@jizhang/shared';

export default function Dashboard() {
  const { summary, accounts, transactions, fetchSummary, fetchAccounts, fetchTransactions } = useStore();
  const [year] = useState(dayjs().year());
  const [month] = useState(dayjs().month() + 1);

  useEffect(() => {
    fetchSummary(year, month);
    fetchAccounts();
    fetchTransactions({ limit: 5, start_date: `${year}-${String(month).padStart(2,'0')}-01` });
  }, []);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="space-y-4">
      {/* 总资产卡片 */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-5 text-white shadow-md">
        <p className="text-sm opacity-80 mb-1">总资产</p>
        <p className="text-3xl font-bold">¥{formatAmount(totalBalance)}</p>
        <p className="text-xs opacity-70 mt-1">{dayjs().format('YYYY年MM月DD日')}</p>
      </div>

      {/* 本月收支 */}
      {summary && (
        <div className="card">
          <h2 className="text-sm font-medium text-gray-500 mb-3">本月收支</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">收入</p>
              <p className="text-lg font-semibold text-income">¥{formatAmount(summary.income)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">支出</p>
              <p className="text-lg font-semibold text-expense">¥{formatAmount(summary.expense)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">结余</p>
              <p className={`text-lg font-semibold ${summary.balance >= 0 ? 'text-income' : 'text-expense'}`}>
                ¥{formatAmount(summary.balance)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 账户列表 */}
      <div className="card">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-medium text-gray-500">我的账户</h2>
          <Link to="/accounts" className="text-xs text-primary-500">管理</Link>
        </div>
        <div className="space-y-2">
          {accounts.map((acc) => (
            <div key={acc.id} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">{acc.icon || '💰'}</span>
                <span className="text-sm font-medium">{acc.name}</span>
              </div>
              <span className={`text-sm font-semibold ${acc.balance >= 0 ? 'text-gray-800' : 'text-expense'}`}>
                ¥{formatAmount(acc.balance)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 最近交易 */}
      <div className="card">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-medium text-gray-500">最近交易</h2>
          <Link to="/transactions" className="text-xs text-primary-500">全部</Link>
        </div>
        {transactions.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-4">暂无记录，去记一笔吧～</p>
        ) : (
          <div className="space-y-1">
            {transactions.map((tx: Transaction) => (
              <TransactionItem key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionItem({ tx }: { tx: Transaction }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-xl">{tx.category_icon || '📦'}</span>
        <div>
          <p className="text-sm font-medium">{tx.category_name || TRANSACTION_TYPE_LABELS[tx.type]}</p>
          <p className="text-xs text-gray-400">{tx.note || tx.account_name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold ${tx.type === 'income' ? 'text-income' : tx.type === 'expense' ? 'text-expense' : 'text-transfer'}`}>
          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}¥{formatAmount(tx.amount)}
        </p>
        <p className="text-xs text-gray-400">{tx.date}</p>
      </div>
    </div>
  );
}
