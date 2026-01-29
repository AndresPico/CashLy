import { Router } from 'express';
import * as accountsController from '../controllers/account.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  accountCreateSchema,
  accountUpdateSchema
} from '../validators/account.schema.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate(accountCreateSchema),
  accountsController.createAccount
);

router.get('/', accountsController.getAccounts);

router.get('/:id', accountsController.getAccountById);

router.put(
  '/:id',
  validate(accountUpdateSchema),
  accountsController.updateAccount
);

router.delete('/:id', accountsController.deleteAccount);

export default router;
