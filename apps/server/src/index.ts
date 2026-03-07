import express from 'express';
import cors from 'cors';
import { initDB } from './db/database';
import transactionsRouter from './routes/transactions';
import accountsRouter from './routes/accounts';
import categoriesRouter from './routes/categories';
import budgetsRouter from './routes/budgets';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 初始化数据库
initDB();

// 路由
app.use('/api/transactions', transactionsRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/budgets', budgetsRouter);

// 健康检查
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
});

export default app;
