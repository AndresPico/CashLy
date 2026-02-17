import * as accountsService from '../services/accounts.service.js';

const normalizeAccountPayload = (payload = {}) => {
  const normalized = { ...payload };

  if (normalized.type !== 'bank') {
    normalized.bank_name = null;
    return normalized;
  }

  if (typeof normalized.bank_name === 'string') {
    const trimmed = normalized.bank_name.trim();
    normalized.bank_name = trimmed || null;
    return normalized;
  }

  if (normalized.bank_name == null) {
    normalized.bank_name = null;
  }

  return normalized;
};

/**
 * POST /accounts
 */
export const createAccount = async (req, res) => {
  try {
    const account = await accountsService.createAccount({
      userId: req.user.id,
      ...normalizeAccountPayload(req.body)
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
      normalizeAccountPayload(req.body)
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
    console.log('=== ELIMINANDO CUENTA ===');
    console.log('ID a eliminar:', req.params.id);
    console.log('Usuario:', req.user.id);
    console.log('=========================');

    const deleted = await accountsService.deleteAccount(
      req.params.id,
      req.user.id
    );

    return res.status(200).json({
      message: 'Account deleted successfully',
      deleted_id: deleted.id
    });
  } catch (err) {
    console.error('DELETE /accounts/:id error:', err);

    if (err.code === 'ACCOUNT_NOT_FOUND') {
      return res.status(404).json({ error: err.message });
    }

    if (err.code === '23503') {
      return res.status(409).json({
        error: 'Cannot delete account because it has related records'
      });
    }

    return res.status(400).json({ error: err.message });
  }
};
