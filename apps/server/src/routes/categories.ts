import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import db from '../db/database';

const router = Router();

// GET /api/categories
router.get('/', (req: Request, res: Response) => {
  const { type } = req.query;
  if (type) {
    res.json(db.prepare('SELECT * FROM categories WHERE type = ? ORDER BY sort_order ASC').all(type as string));
  } else {
    res.json(db.prepare('SELECT * FROM categories ORDER BY type, sort_order ASC').all());
  }
});

// POST /api/categories
router.post('/', [
  body('name').notEmpty().trim(),
  body('type').isIn(['income', 'expense']),
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, type, icon, color, sort_order = 0 } = req.body;
  const result = db.prepare(
    `INSERT INTO categories (name, type, icon, color, sort_order) VALUES (?, ?, ?, ?, ?)`
  ).run(name, type, icon || null, color || null, sort_order);

  res.status(201).json(db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid));
});

// PUT /api/categories/:id
router.put('/:id', param('id').isInt(), (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ message: '分类不存在' });

  const { name, icon, color, sort_order } = req.body;
  db.prepare(`UPDATE categories SET name=?, icon=?, color=?, sort_order=? WHERE id=?`)
    .run(name ?? existing.name, icon ?? existing.icon, color ?? existing.color, sort_order ?? existing.sort_order, id);

  res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(id));
});

// DELETE /api/categories/:id
router.delete('/:id', param('id').isInt(), (req: Request, res: Response) => {
  const { id } = req.params;
  const txCount = (db.prepare('SELECT COUNT(*) as cnt FROM transactions WHERE category_id = ?').get(id) as any).cnt;
  if (txCount > 0) return res.status(400).json({ message: '该分类存在交易记录，无法删除' });

  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.json({ message: '删除成功' });
});

export default router;
