import * as BudgetsService from '../services/budgets.service.js';

export async function createBudget(req, res) {
  try {
    const budget = await BudgetsService.createBudget(req.body, req.user.id);
    res.status(201).json(budget);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function getBudgets(req, res) {
  try {
    const budgets = await BudgetsService.getBudgets(req.user.id, req.query);
    res.json(budgets);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function getBudget(req, res) {
  try {
    const budget = await BudgetsService.getBudgetById(
      req.params.id,
      req.user.id
    );
    res.json(budget);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateBudget(req, res) {
  try {
    const budget = await BudgetsService.updateBudget(
      req.params.id,
      req.user.id,
      req.body
    );
    res.json(budget);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteBudget(req, res) {
  try {
    await BudgetsService.deleteBudget(req.params.id, req.user.id);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
