import { Router } from 'express';
import * as BudgetsController from '../controllers/budgets.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', BudgetsController.createBudget);
router.get('/', BudgetsController.getBudgets);
router.get('/:id', BudgetsController.getBudget);
router.put('/:id', BudgetsController.updateBudget);
router.delete('/:id', BudgetsController.deleteBudget);

export default router;
