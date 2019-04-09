import R from 'ramda';
import Podcast from '../Models/Podcast';
import {
  find, findOrCreate, handleUpdate,
} from '../Helpers/db';

export const findOrCreatePodcast = R.partial(findOrCreate, [Podcast]);
export const handlePodcastUpdate = R.partial(handleUpdate, [Podcast, ['episodes']]);
export const findPodcasts = R.partial(find, [Podcast, { _id: 1, avrageRating: 1, episodes: 1 }]);
