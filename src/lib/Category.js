import R from 'ramda';
import Category from '../Models/Category';

import {
  create, findById, handleUpdate, deleteOne, find, deleteMany,
} from '../Helpers/db';

export const createCategory = R.partial(create, [Category]);

export const findCategoryById = R.partial(findById, [Category]);

export const deleteCategory = R.partial(deleteOne, [Category]);

export const deleteCategories = R.partial(deleteMany, [Category]);

export const handleCategoryUpdate = R.partial(handleUpdate, [Category, ['podcasts']]);

export const findCategories = R.partial(find, [Category, {
  _id: 1, name: 1, user: 1, podcasts: 1,
}]);
