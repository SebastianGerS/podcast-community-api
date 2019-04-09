import R from 'ramda';
import Podcast from '../Models/Podcast';
import {
  findOrCreate, handleUpdate,
} from '../Helpers/db';

export const findOrCreatePodcast = R.partial(findOrCreate, [Podcast]);
export const handlePodcastUpdate = R.partial(handleUpdate, [Podcast, ['episodes']]);
