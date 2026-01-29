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
      req.user.id
    );

    res.json(transactions);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
