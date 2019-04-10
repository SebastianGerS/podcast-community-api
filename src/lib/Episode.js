import R from 'ramda';
import Episode from '../Models/Episode';
import {
  findOrCreate, handleUpdate, find,
} from '../Helpers/db';

export const findOrCreateEpisode = R.partial(findOrCreate, [Episode]);
export const handleEpisodeUpdate = R.partial(handleUpdate, [Episode, ['ratings']]);
export const findEpisodes = R.partial(find, [Episode, {
  _id: 1, avrageRating: 1, ratings: 1, podcast: 1,
}]);
