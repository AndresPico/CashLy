import * as GoalsService from '../services/goals.service.js';

export async function createGoal(req, res) {
  try {
    const goal = await GoalsService.createGoal(req.body, req.user.id);
    res.status(201).json(goal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function getGoals(req, res) {
  try {
    const goals = await GoalsService.getGoals(req.user.id);
    res.json(goals);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function getGoal(req, res) {
  try {
    const goal = await GoalsService.getGoalById(
      req.params.id,
      req.user.id
    );
    res.json(goal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateGoal(req, res) {
  try {
    const goal = await GoalsService.updateGoal(
      req.params.id,
      req.user.id,
      req.body
    );
    res.json(goal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteGoal(req, res) {
  try {
    await GoalsService.deleteGoal(req.params.id, req.user.id);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function getGoalContributions(req, res) {
  try {
    const contributions = await GoalsService.getGoalContributions(
      req.params.id,
      req.user.id
    );
    res.json(contributions);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function createGoalContribution(req, res) {
  try {
    const contribution = await GoalsService.createGoalContribution(
      req.params.id,
      req.user.id,
      req.body
    );
    res.status(201).json(contribution);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateGoalContribution(req, res) {
  try {
    const contribution = await GoalsService.updateGoalContribution(
      req.params.id,
      req.params.contributionId,
      req.user.id,
      req.body
    );
    res.json(contribution);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteGoalContribution(req, res) {
  try {
    await GoalsService.deleteGoalContribution(
      req.params.id,
      req.params.contributionId,
      req.user.id
    );
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
