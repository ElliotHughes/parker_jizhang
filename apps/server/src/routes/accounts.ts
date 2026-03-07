import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import db from '../db/database';

const router = Router();

// GET /api/accounts
router.get('/', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM accounts ORDER BY id ASC').all();
  res.json(rows);
});

// POST /api/accounts
router.post('/', [
  body('name').notEmpty().trim(),
  body('type').isIn(['cash', 'bank', 'credit', 'other']),
  body('balance').optional().isFloat(),
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, type, balance = 0, icon, color } = req.body;
  const result = db.prepare(
    `INSERT INTO accounts (name, type, balance, icon, color) VALUES (?, ?, ?, ?, ?)`
  ).run(name, type, balance, icon || null, color || null);

  res.status(201).json(db.prepare('SELECT * FROM accounts WHERE id = ?').get(result.lastInsertRowid));
});

// PUT /api/accounts/:id
router.put('/:id', [
  param('id').isInt(),
  body('name').optional().notEmpty().trim(),
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ message: '账户不存在' });

  const { name, type, icon, color } = req.body;
  db.prepare(`UPDATE accounts SET name=?, type=?, icon=?, color=?, updated_at=datetime('now','localtime') WHERE id=?`)
    .run(name ?? existing.name, type ?? existing.type, icon ?? existing.icon, color ?? existing.color, id);

  res.json(db.prepare('SELECT * FROM accounts WHERE id = ?').get(id));
});

// DELETE /api/accounts/:id
router.delete('/:id', param('id').isInt(), (req: Request, res: Response) => {
  const { id } = req.params;
  const txCount = (db.prepare('SELECT COUNT(*) as cnt FROM transactions WHERE account_id = ?').get(id) as any).cnt;
  if (txCount > 0) return res.status(400).json({ message: '该账户存在交易记录，无法删除' });

  db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
  res.json({ message: '删除成功' });
});

export default router;
