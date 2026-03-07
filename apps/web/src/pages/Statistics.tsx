import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts';
import { useStore } from '../store/useStore';
import { transactionApi, formatAmount } from '@jizhang/shared';

export default function Statistics() {
  const { summary, fetchSummary } = useStore();
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    fetchSummary(year, month);
  }, [year, month]);

  useEffect(() => {
    // 获取近6个月数据
    const fetchMonthly = async () => {
      const promises = Array.from({ length: 6 }, (_, i) => {
        const d = dayjs(`${year}-${String(month).padStart(2,'0')}-01`).subtract(i, 'month');
        return transactionApi.summary({ year: d.year(), month: d.month() + 1 }).then((s) => ({
          name: d.format('MM月'),
          收入: s.income,
          支出: s.expense,
        }));
      });
      const data = (await Promise.all(promises)).reverse();
      setMonthlyData(data);
    };
    fetchMonthly();
  }, [year, month]);

  const expenseData = summary?.byCategory.filter((c) => c.type === 'expense') || [];
  const COLORS = ['#FF6B6B', '#FF9F43', '#A29BFE', '#FD79A8', '#55EFC4', '#74B9FF', '#FDCB6E', '#B2BEC3'];

  return (
    <div className="space-y-4">
      {/* 月份选择 */}
      <div className="flex items-center gap-2">
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input w-24">
          {[2023, 2024, 2025, 2026].map((y) => <option key={y}>{y}</option>)}
        </select>
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="input w-24">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{m}月</option>
          ))}
        </select>
      </div>

      {/* 收支汇总 */}
      {summary && (
        <div className="card">
          <h2 className="text-sm font-medium text-gray-500 mb-3">{year}年{month}月汇总</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-400">收入</p>
              <p className="text-lg font-bold text-income">¥{formatAmount(summary.income)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">支出</p>
              <p className="text-lg font-bold text-expense">¥{formatAmount(summary.expense)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">结余</p>
              <p className={`text-lg font-bold ${summary.balance >= 0 ? 'text-income' : 'text-expense'}`}>
                ¥{formatAmount(summary.balance)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 支出分类饼图 */}
      {expenseData.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-medium text-gray-500 mb-3">支出分类</h2>
          <div className="flex gap-4 items-center">
            <PieChart width={160} height={160}>
              <Pie data={expenseData} cx={75} cy={75} innerRadius={45} outerRadius={75}
                dataKey="total" nameKey="name">
                {expenseData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => `¥${formatAmount(v)}`} />
            </PieChart>
            <div className="flex-1 space-y-1.5">
              {expenseData.slice(0, 6).map((c, index) => (
                <div key={c.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                    <span>{c.icon} {c.name}</span>
                  </div>
                  <span className="font-medium text-gray-700">¥{formatAmount(c.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 近6个月收支柱状图 */}
      {monthlyData.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-medium text-gray-500 mb-3">近6个月趋势</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barSize={14}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={45} tickFormatter={(v) => `¥${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} />
              <Tooltip formatter={(v: number) => `¥${formatAmount(v)}`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="收入" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="支出" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
