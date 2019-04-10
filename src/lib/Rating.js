import R from 'ramda';
import Rating from '../Models/Rating';
import {
  find, update, create, findOne,
} from '../Helpers/db';

export const findOneRating = R.partial(findOne, [Rating]);
export const findRatings = R.partial(find, [Rating, {
  _id: 1, episode: 1, rating: 1, user: 1,
}]);
export const updateRating = R.partial(update, [Rating]);

export const createRating = R.partial(create, [Rating]);
