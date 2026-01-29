import { Router } from 'express';
import * as GoalsController from '../controllers/goals.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', GoalsController.createGoal);
router.get('/', GoalsController.getGoals);
router.get('/:id', GoalsController.getGoal);
router.put('/:id', GoalsController.updateGoal);
router.delete('/:id', GoalsController.deleteGoal);

export default router;
