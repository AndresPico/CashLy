import express from 'express';
import cors from 'cors';

import accountsRoutes from './routes/accounts.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import transactionsRoutes from './routes/transactions.routes.js';
import goalsRoutes from './routes/goals.routes.js';
import budgetsRoutes from './routes/budgets.routes.js';

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

//Rutas
app.use('/api/accounts', accountsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/budgets', budgetsRoutes);

export default app;
