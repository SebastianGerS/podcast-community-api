import { findRatings } from '../lib/Rating';
import { getAvrage } from './general';
import { handleEpisodeUpdate } from '../lib/Episode';
import { handlePodcastUpdate } from '../lib/Podcast';

export async function emitUpdatedRatings(io, podcastId, podcastEpisodes, episodeId) {
  const episodeRatings = await findRatings({ query: { episode: episodeId } }).catch(error => error);

  if (episodeRatings.errmsg) return { error: episodeRatings };

  const avrageEpisodeRating = getAvrage(episodeRatings, 'rating');

  const updatedEpisode = await handleEpisodeUpdate(
    episodeId,
    { avrageRating: avrageEpisodeRating },
  ).catch(error => error);

  if (updatedEpisode.errmsg) return { error: updatedEpisode };

  io.emit(`episodes/${episodeId}/rating`, avrageEpisodeRating);

  io.emit(`search/episodes/${episodeId}/rating`, { episodeId, rating: avrageEpisodeRating });

  const query = { query: { episode: { $in: podcastEpisodes } } };

  const podcastRatings = await findRatings(query).catch(error => error);

  if (podcastRatings.errmsg) return { error: podcastRatings };

  const avragePodcastRating = getAvrage(podcastRatings, 'rating');

  const updatedPodcast = await handlePodcastUpdate(
    podcastId,
    { avrageRating: avragePodcastRating },
  ).catch(error => error);

  if (updatedPodcast.errmsg) return { error: updatedPodcast };

  io.emit(`podcasts/${podcastId}/rating`, { avrageRating: avragePodcastRating, episodeRating: { episodeId, rating: avrageEpisodeRating } });
  io.emit(`search/podcasts/${podcastId}/rating`, { podcastId, rating: avragePodcastRating });

  return { info: 'success' };
}
