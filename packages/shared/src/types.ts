export type TransactionType = 'income' | 'expense' | 'transfer';
export type AccountType = 'cash' | 'bank' | 'credit' | 'other';
export type BudgetPeriod = 'monthly' | 'yearly';

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  balance: number;
  icon?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  sort_order: number;
}

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  category_id?: number;
  account_id: number;
  to_account_id?: number;
  note?: string;
  date: string;
  created_at: string;
  updated_at: string;
  // joined fields
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  account_name?: string;
  to_account_name?: string;
}

export interface Budget {
  id: number;
  category_id?: number;
  amount: number;
  period: BudgetPeriod;
  year: number;
  month?: number;
  created_at: string;
  // joined fields
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  spent?: number;
}

export interface Summary {
  income: number;
  expense: number;
  balance: number;
  byCategory: Array<{
    id: number;
    name: string;
    icon?: string;
    color?: string;
    type: TransactionType;
    total: number;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
