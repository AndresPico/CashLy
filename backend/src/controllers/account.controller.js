import * as accountsService from '../services/accounts.service.js';

/**
 * POST /accounts
 */
export const createAccount = async (req, res) => {
  try {
    const account = await accountsService.createAccount({
      userId: req.user.id,
      ...req.body
    });

    res.status(201).json(account);
  } catch (err) {
    console.error(err);
    res.status(422).json({
      message: err.message
    });
  }
};

/**
 * GET /accounts
 */
export const getAccounts = async (req, res) => {
  try {
    const accounts = await accountsService.getAccountsByUser(req.user.id);
    res.status(200).json(accounts);
  } catch (err) {
    console.error('GET /accounts error:', err);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
};

/**
 * GET /accounts/:id
 */
export const getAccountById = async (req, res) => {
  try {
    const account = await accountsService.getAccountById(
      req.params.id,
      req.user.id
    );

    res.json(account);
  } catch (err) {
    res.status(404).json({ error: 'Account not found' });
  }
};

/**
 * PUT /accounts/:id
 */
export const updateAccount = async (req, res) => {
  try {
    const account = await accountsService.updateAccount(
      req.params.id,
      req.user.id,
      req.body
    );

    res.json(account);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * DELETE /accounts/:id
 */
export const deleteAccount = async (req, res) => {
  try {
    await accountsService.deleteAccount(
      req.params.id,
      req.user.id
    );

    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
