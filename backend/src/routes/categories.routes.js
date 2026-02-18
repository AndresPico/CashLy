import { Router } from 'express';
import * as categoriesController from '../controllers/categories.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  categoryCreateSchema,
  categoryQuerySchema,
  categoryUpdateSchema
} from '../validators/category.schema.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate(categoryCreateSchema),
  categoriesController.createCategory
);

router.get(
  '/',
  validate(categoryQuerySchema, 'query'),
  categoriesController.getCategories
);

router.put(
  '/:id',
  validate(categoryUpdateSchema),
  categoriesController.updateCategory
);

router.delete('/:id', categoriesController.deleteCategory);

export default router;
