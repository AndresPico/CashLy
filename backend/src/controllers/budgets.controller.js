import * as BudgetsService from '../services/budgets.service.js';
import { createBudgetSchema, updateBudgetSchema } from '../validators/budgets.validator.js';

export async function createBudget(req, res) {
  const data = createBudgetSchema.parse(req.body);
  const budget = await BudgetsService.createBudget(data, req.user.id);
  res.status(201).json(budget);
}

export async function getBudgets(req, res) {
  const budgets = await BudgetsService.getBudgets(req.user.id);
  res.json(budgets);
}

export async function getBudget(req, res) {
  const budget = await BudgetsService.getBudgetById(
    req.params.id,
    req.user.id
  );
  res.json(budget);
}

export async function updateBudget(req, res) {
  const data = updateBudgetSchema.parse(req.body);
  const budget = await BudgetsService.updateBudget(
    req.params.id,
    req.user.id,
    data
  );
  res.json(budget);
}

export async function deleteBudget(req, res) {
  await BudgetsService.deleteBudget(req.params.id, req.user.id);
  res.status(204).send();
}
