import uuidv4 from 'uuid/v4';
import * as Category from '../lib/Category';
import { handleUserUpdate } from '../lib/User';

export default {
  async create(req, res) {
    const category = await Category.createCategory(
      { _id: uuidv4(), name: req.body.name, user: req.userId },
    ).catch(error => error);

    if (category.error) return res.status(404).json({ error: category });
    const user = await handleUserUpdate(req.userId, { categories: category._id });

    if (user.error) return res.status(404).json({ error: user });

    return res.status(200).json({ category });
  },
  async update(req, res) {
    const category = await Category.handleCategoryUpdate(
      req.params.categoryId,
      req.body,
    ).catch(error => error);

    if (category.error) return res.status(404).json({ error: category });

    return res.status(200).json({ category });
  },
  async delete(req, res) {
    const category = await Category.deleteCategory(
      { _id: req.params.categoryId },
    ).catch(error => error);
    if (category.error) return res.status(404).json({ error: category });
    const user = await handleUserUpdate(req.userId, { categories: req.params.categoryId });

    if (user.error) return res.status(404).json({ error: user });

    return res.status(200).json({ category });
  },
};
