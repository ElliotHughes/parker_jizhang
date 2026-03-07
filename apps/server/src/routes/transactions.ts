import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import db from '../db/database';

const router = Router();

// GET /api/transactions
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(['income', 'expense', 'transfer']),
  query('account_id').optional().isInt(),
  query('category_id').optional().isInt(),
  query('start_date').optional().isString(),
  query('end_date').optional().isString(),
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  let where = 'WHERE 1=1';
  const params: any[] = [];

  if (req.query.type) { where += ' AND t.type = ?'; params.push(req.query.type); }
  if (req.query.account_id) { where += ' AND t.account_id = ?'; params.push(req.query.account_id); }
  if (req.query.category_id) { where += ' AND t.category_id = ?'; params.push(req.query.category_id); }
  if (req.query.start_date) { where += ' AND t.date >= ?'; params.push(req.query.start_date); }
  if (req.query.end_date) { where += ' AND t.date <= ?'; params.push(req.query.end_date); }

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM transactions t ${where}`).get(...params) as any).cnt;
  const rows = db.prepare(`
    SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
           a.name as account_name, a2.name as to_account_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts a ON t.account_id = a.id
    LEFT JOIN accounts a2 ON t.to_account_id = a2.id
    ${where}
    ORDER BY t.date DESC, t.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({ data: rows, total, page, limit });
});

// GET /api/transactions/summary
router.get('/summary', (req: Request, res: Response) => {
  const { year, month } = req.query;
  let where = 'WHERE 1=1';
  const params: any[] = [];

  if (year && month) {
    const ym = `${year}-${String(month).padStart(2, '0')}`;
    where += ` AND date LIKE '${ym}%'`;
  } else if (year) {
    where += ` AND date LIKE '${year}%'`;
  }

  const income = (db.prepare(`SELECT COALESCE(SUM(amount),0) as total FROM transactions ${where} AND type='income'`).get(...params) as any).total;
  const expense = (db.prepare(`SELECT COALESCE(SUM(amount),0) as total FROM transactions ${where} AND type='expense'`).get(...params) as any).total;

  const byCategory = db.prepare(`
    SELECT c.id, c.name, c.icon, c.color, t.type, COALESCE(SUM(t.amount),0) as total
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    ${where} AND t.type IN ('income','expense')
    GROUP BY c.id, t.type
    ORDER BY total DESC
  `).all(...params);

  res.json({ income, expense, balance: income - expense, byCategory });
});

// POST /api/transactions
router.post('/', [
  body('type').isIn(['income', 'expense', 'transfer']),
  body('amount').isFloat({ min: 0.01 }),
  body('account_id').isInt(),
  body('date').isString().notEmpty(),
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { type, amount, category_id, account_id, to_account_id, note, date } = req.body;

  const insertTx = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO transactions (type, amount, category_id, account_id, to_account_id, note, date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(type, amount, category_id || null, account_id, to_account_id || null, note || null, date);

    // 更新账户余额
    if (type === 'income') {
      db.prepare(`UPDATE accounts SET balance = balance + ?, updated_at = datetime('now','localtime') WHERE id = ?`).run(amount, account_id);
    } else if (type === 'expense') {
      db.prepare(`UPDATE accounts SET balance = balance - ?, updated_at = datetime('now','localtime') WHERE id = ?`).run(amount, account_id);
    } else if (type === 'transfer' && to_account_id) {
      db.prepare(`UPDATE accounts SET balance = balance - ?, updated_at = datetime('now','localtime') WHERE id = ?`).run(amount, account_id);
      db.prepare(`UPDATE accounts SET balance = balance + ?, updated_at = datetime('now','localtime') WHERE id = ?`).run(amount, to_account_id);
    }

    return result.lastInsertRowid;
  });

  const id = insertTx();
  const row = db.prepare(`
    SELECT t.*, c.name as category_name, c.icon as category_icon,
           a.name as account_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts a ON t.account_id = a.id
    WHERE t.id = ?
  `).get(id);

  res.status(201).json(row);
});

// PUT /api/transactions/:id
router.put('/:id', [
  param('id').isInt(),
  body('amount').optional().isFloat({ min: 0.01 }),
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ message: '记录不存在' });

  const { type, amount, category_id, account_id, to_account_id, note, date } = req.body;

  db.transaction(() => {
    // 还原旧余额
    if (existing.type === 'income') {
      db.prepare(`UPDATE accounts SET balance = balance - ? WHERE id = ?`).run(existing.amount, existing.account_id);
    } else if (existing.type === 'expense') {
      db.prepare(`UPDATE accounts SET balance = balance + ? WHERE id = ?`).run(existing.amount, existing.account_id);
    } else if (existing.type === 'transfer' && existing.to_account_id) {
      db.prepare(`UPDATE accounts SET balance = balance + ? WHERE id = ?`).run(existing.amount, existing.account_id);
      db.prepare(`UPDATE accounts SET balance = balance - ? WHERE id = ?`).run(existing.amount, existing.to_account_id);
    }

    const newType = type ?? existing.type;
    const newAmount = amount ?? existing.amount;
    const newAccountId = account_id ?? existing.account_id;
    const newToAccountId = to_account_id ?? existing.to_account_id;

    db.prepare(`
      UPDATE transactions SET type=?, amount=?, category_id=?, account_id=?, to_account_id=?, note=?, date=?,
      updated_at=datetime('now','localtime') WHERE id=?
    `).run(newType, newAmount, category_id ?? existing.category_id, newAccountId, newToAccountId ?? null, note ?? existing.note, date ?? existing.date, id);

    // 应用新余额
    if (newType === 'income') {
      db.prepare(`UPDATE accounts SET balance = balance + ? WHERE id = ?`).run(newAmount, newAccountId);
    } else if (newType === 'expense') {
      db.prepare(`UPDATE accounts SET balance = balance - ? WHERE id = ?`).run(newAmount, newAccountId);
    } else if (newType === 'transfer' && newToAccountId) {
      db.prepare(`UPDATE accounts SET balance = balance - ? WHERE id = ?`).run(newAmount, newAccountId);
      db.prepare(`UPDATE accounts SET balance = balance + ? WHERE id = ?`).run(newAmount, newToAccountId);
    }
  })();

  const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  res.json(row);
});

// DELETE /api/transactions/:id
router.delete('/:id', param('id').isInt(), (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ message: '记录不存在' });

  db.transaction(() => {
    if (existing.type === 'income') {
      db.prepare(`UPDATE accounts SET balance = balance - ? WHERE id = ?`).run(existing.amount, existing.account_id);
    } else if (existing.type === 'expense') {
      db.prepare(`UPDATE accounts SET balance = balance + ? WHERE id = ?`).run(existing.amount, existing.account_id);
    } else if (existing.type === 'transfer' && existing.to_account_id) {
      db.prepare(`UPDATE accounts SET balance = balance + ? WHERE id = ?`).run(existing.amount, existing.account_id);
      db.prepare(`UPDATE accounts SET balance = balance - ? WHERE id = ?`).run(existing.amount, existing.to_account_id);
    }
    db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
  })();

  res.json({ message: '删除成功' });
});

export default router;
