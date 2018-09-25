import R from 'ramda';
import Category from '../Models/Category';

import {
  create, findById, handleUpdate, deleteOne,
} from '../Helpers/db';

export const createCategory = R.partial(create, [Category]);

export const findCategoryById = R.partial(findById, [Category]);

export const deleteCategory = R.partial(deleteOne, [Category]);

export const handleCategoryUpdate = R.partial(handleUpdate, [Category, ['podcasts']]);
