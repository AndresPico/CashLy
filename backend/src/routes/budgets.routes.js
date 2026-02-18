import { Router } from 'express';
import * as BudgetsController from '../controllers/budgets.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  budgetsQuerySchema,
  createBudgetSchema,
  updateBudgetSchema
} from '../validators/budgets.validator.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createBudgetSchema), BudgetsController.createBudget);
router.get('/', validate(budgetsQuerySchema, 'query'), BudgetsController.getBudgets);
router.get('/:id', BudgetsController.getBudget);
router.put('/:id', validate(updateBudgetSchema), BudgetsController.updateBudget);
router.delete('/:id', BudgetsController.deleteBudget);

export default router;
