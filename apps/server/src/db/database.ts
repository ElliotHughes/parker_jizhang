import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/jizhang.db');
const DB_DIR = path.dirname(DB_PATH);

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// 开启 WAL 模式，提升并发性能
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDB() {
  db.exec(`
    -- 账户表
    CREATE TABLE IF NOT EXISTS accounts (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT NOT NULL,
      type      TEXT NOT NULL DEFAULT 'cash', -- cash | bank | credit | other
      balance   REAL NOT NULL DEFAULT 0,
      icon      TEXT,
      color     TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- 分类表
    CREATE TABLE IF NOT EXISTS categories (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT NOT NULL,
      type      TEXT NOT NULL, -- income | expense
      icon      TEXT,
      color     TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    -- 交易记录表
    CREATE TABLE IF NOT EXISTS transactions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      type        TEXT NOT NULL,         -- income | expense | transfer
      amount      REAL NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      account_id  INTEGER NOT NULL REFERENCES accounts(id),
      to_account_id INTEGER REFERENCES accounts(id), -- 转账用
      note        TEXT,
      date        TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- 预算表
    CREATE TABLE IF NOT EXISTS budgets (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES categories(id),
      amount      REAL NOT NULL,
      period      TEXT NOT NULL DEFAULT 'monthly', -- monthly | yearly
      year        INTEGER NOT NULL,
      month       INTEGER,
      created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
  `);

  // 插入默认账户
  const accountCount = db.prepare('SELECT COUNT(*) as cnt FROM accounts').get() as { cnt: number };
  if (accountCount.cnt === 0) {
    db.prepare(`INSERT INTO accounts (name, type, balance, icon, color) VALUES (?, ?, ?, ?, ?)`).run(
      '现金', 'cash', 0, '💵', '#4CAF50'
    );
    db.prepare(`INSERT INTO accounts (name, type, balance, icon, color) VALUES (?, ?, ?, ?, ?)`).run(
      '银行卡', 'bank', 0, '💳', '#2196F3'
    );
  }

  // 插入默认分类
  const categoryCount = db.prepare('SELECT COUNT(*) as cnt FROM categories').get() as { cnt: number };
  if (categoryCount.cnt === 0) {
    const expenseCategories = [
      { name: '餐饮', icon: '🍜', color: '#FF6B6B' },
      { name: '交通', icon: '🚗', color: '#FF9F43' },
      { name: '购物', icon: '🛒', color: '#A29BFE' },
      { name: '娱乐', icon: '🎮', color: '#FD79A8' },
      { name: '住房', icon: '🏠', color: '#55EFC4' },
      { name: '医疗', icon: '💊', color: '#74B9FF' },
      { name: '教育', icon: '📚', color: '#FDCB6E' },
      { name: '其他', icon: '📦', color: '#B2BEC3' },
    ];
    const incomeCategories = [
      { name: '工资', icon: '💰', color: '#00B894' },
      { name: '兼职', icon: '💼', color: '#0984E3' },
      { name: '投资', icon: '📈', color: '#6C5CE7' },
      { name: '其他', icon: '🎁', color: '#B2BEC3' },
    ];
    const insert = db.prepare(`INSERT INTO categories (name, type, icon, color, sort_order) VALUES (?, ?, ?, ?, ?)`);
    expenseCategories.forEach((c, i) => insert.run(c.name, 'expense', c.icon, c.color, i));
    incomeCategories.forEach((c, i) => insert.run(c.name, 'income', c.icon, c.color, i));
  }

  console.log('✅ 数据库初始化完成:', DB_PATH);
}

export default db;
