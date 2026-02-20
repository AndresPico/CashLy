import { Router } from 'express';
import * as GoalsController from '../controllers/goals.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createGoalContributionSchema,
  createGoalSchema,
  updateGoalContributionSchema,
  updateGoalSchema
} from '../validators/goals.validator.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createGoalSchema), GoalsController.createGoal);
router.get('/', GoalsController.getGoals);
router.get('/:id', GoalsController.getGoal);
router.put('/:id', validate(updateGoalSchema), GoalsController.updateGoal);
router.delete('/:id', GoalsController.deleteGoal);
router.get('/:id/contributions', GoalsController.getGoalContributions);
router.post(
  '/:id/contributions',
  validate(createGoalContributionSchema),
  GoalsController.createGoalContribution
);
router.put(
  '/:id/contributions/:contributionId',
  validate(updateGoalContributionSchema),
  GoalsController.updateGoalContribution
);
router.delete('/:id/contributions/:contributionId', GoalsController.deleteGoalContribution);

export default router;
