/**
 * 格式化金额，保留两位小数并加千分位
 */
export function formatAmount(amount: number, showSign = false): string {
  const abs = Math.abs(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (showSign && amount > 0) return `+${abs}`;
  if (amount < 0) return `-${abs}`;
  return abs;
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 获取当月第一天和最后一天
 */
export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const last = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
  return { start, end };
}

/**
 * 获取预算使用进度百分比 (0-100)
 */
export function getBudgetProgress(spent: number, budget: number): number {
  if (budget <= 0) return 0;
  return Math.min(100, Math.round((spent / budget) * 100));
}

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: '现金',
  bank: '银行卡',
  credit: '信用卡',
  other: '其他',
};

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  income: '收入',
  expense: '支出',
  transfer: '转账',
};
