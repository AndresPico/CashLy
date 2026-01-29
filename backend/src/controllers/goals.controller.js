import * as GoalsService from '../services/goals.service.js';
import { createGoalSchema, updateGoalSchema } from '../validators/goals.validator.js';

export async function createGoal(req, res) {
  const data = createGoalSchema.parse(req.body);
  const goal = await GoalsService.createGoal(data, req.user.id);
  res.status(201).json(goal);
}

export async function getGoals(req, res) {
  const goals = await GoalsService.getGoals(req.user.id);
  res.json(goals);
}

export async function getGoal(req, res) {
  const goal = await GoalsService.getGoalById(
    req.params.id,
    req.user.id
  );
  res.json(goal);
}

export async function updateGoal(req, res) {
  const data = updateGoalSchema.parse(req.body);
  const goal = await GoalsService.updateGoal(
    req.params.id,
    req.user.id,
    data
  );
  res.json(goal);
}

export async function deleteGoal(req, res) {
  await GoalsService.deleteGoal(req.params.id, req.user.id);
  res.status(204).send();
}
