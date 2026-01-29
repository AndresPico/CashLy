import { Router } from 'express';
import * as transactionsController from '../controllers/transaction.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  transactionCreateSchema
} from '../validators/transaction.schema.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate(transactionCreateSchema),
  transactionsController.createTransaction
);

router.get('/', transactionsController.getTransactions);

export default router;
