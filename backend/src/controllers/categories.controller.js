import * as categoriesService from '../services/categories.service.js';

export const createCategory = async (req, res) => {
  try {
    const category = await categoriesService.createCategory({
      userId: req.user.id,
      ...req.body
    });

    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await categoriesService.getCategoriesByUser(
      req.user.id,
      req.query.type
    );

    res.json(categories);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await categoriesService.updateCategory(
      req.params.id,
      req.user.id,
      req.body
    );

    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    await categoriesService.deleteCategory(
      req.params.id,
      req.user.id
    );

    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
