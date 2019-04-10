import { findUserById } from '../lib/User';
import {
  findOneRating, updateRating, createRating,
} from '../lib/Rating';
import { handlePodcastUpdate, findOrCreatePodcast } from '../lib/Podcast';
import { handleEpisodeUpdate, findOrCreateEpisode } from '../lib/Episode';
import { handleMetaUserUpdate } from '../lib/MetaUser';
import { emitUpdatedRatings } from '../Helpers/socket';

export default {
  async create(req, res, io) {
    const { podcastId } = req.params;

    const { rating, episodeId } = req.body;

    const user = await findUserById(req.userId).catch(error => error);

    if (user.errmsg) return res.status(404).json({ error: user });

    const podcast = await findOrCreatePodcast({ _id: podcastId }).catch(error => error);

    if (podcast.errmsg) return res.status(404).json({ error: podcast });

    const query = { episode: episodeId, user: user.metaUser };

    const existingRating = await findOneRating(query).catch(error => error);

    if (!existingRating.errmsg) {
      const updatedRating = await updateRating(existingRating._id, { rating });

      if (updatedRating.errmsg) return res.status(404).json({ error: updatedRating });
    } else {
      const episode = await findOrCreateEpisode(
        { _id: episodeId, podcast: podcastId },
      ).catch(error => error);

      if (episode.errmsg) return res.status(404).json({ error: episode });

      if (!podcast.episodes.includes(episode._id)) {
        const updatedPodcast = await handlePodcastUpdate(podcast._id, { episodes: episodeId });

        if (updatedPodcast.errmsg) return res.status(404).json({ error: updatedPodcast });
      }

      const newRating = await createRating({ rating, episode: episodeId, user: user.metaUser });

      if (newRating.errmsg) return res.status(404).json({ error: newRating });

      const updatedEpisode = await handleEpisodeUpdate(episodeId, { ratings: newRating._id });
      if (updatedEpisode.errmsg) return res.status(404).json({ error: updatedEpisode });


      const updatedMetaUser = await handleMetaUserUpdate(user.metaUser, { ratings: newRating._id });
      if (updatedMetaUser.errmsg) return res.status(404).json({ error: updatedMetaUser });
    }
    const podcastEpisodes = podcast.episodes;

    if (!podcastEpisodes.includes(episodeId)) {
      podcastEpisodes.push(episodeId);
    }

    emitUpdatedRatings(io, podcastId, podcastEpisodes, episodeId);

    return res.status(200).json({ info: 'Your rating has been registerd' });
  },
};
