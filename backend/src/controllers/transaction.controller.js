import * as transactionsService from '../services/transactions.service.js';

export const createTransaction = async (req, res) => {
  try {
    const transaction = await transactionsService.createTransaction({
      userId: req.user.id,
      ...req.body
    });

    res.status(201).json(transaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const transactions = await transactionsService.getTransactionsByUser(
      req.user.id,
      req.query
    );

    res.json(transactions);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const transaction = await transactionsService.updateTransaction(
      req.params.id,
      req.user.id,
      req.body
    );

    res.json(transaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    await transactionsService.deleteTransaction(req.params.id, req.user.id);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
