import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../db/database';

const router = Router();

// GET /api/budgets?year=2024&month=3
router.get('/', (req: Request, res: Response) => {
  const { year, month } = req.query;
  if (!year) return res.status(400).json({ message: '缺少 year 参数' });

  let rows: any[];
  if (month) {
    rows = db.prepare(`
      SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
        (SELECT COALESCE(SUM(t.amount),0) FROM transactions t
         WHERE t.category_id = b.category_id AND t.type='expense'
         AND t.date LIKE ?) as spent
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.year = ? AND (b.month = ? OR b.period = 'yearly')
    `).all(`${year}-${String(month).padStart(2,'0')}%`, year, month);
  } else {
    rows = db.prepare(`
      SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.year = ?
    `).all(year);
  }

  res.json(rows);
});

// POST /api/budgets
router.post('/', [
  body('amount').isFloat({ min: 0.01 }),
  body('year').isInt(),
  body('period').isIn(['monthly', 'yearly']),
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { category_id, amount, period, year, month } = req.body;
  const result = db.prepare(
    `INSERT INTO budgets (category_id, amount, period, year, month) VALUES (?, ?, ?, ?, ?)`
  ).run(category_id || null, amount, period, year, month || null);

  res.status(201).json(db.prepare('SELECT * FROM budgets WHERE id = ?').get(result.lastInsertRowid));
});

// DELETE /api/budgets/:id
router.delete('/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM budgets WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

export default router;
