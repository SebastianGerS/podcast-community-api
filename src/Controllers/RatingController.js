import uuidv4 from 'uuid/v4';
import { findUserById, handleUserUpdate } from '../lib/User';
import {
  findOneRating, updateRating, createRating,
} from '../lib/Rating';
import { handlePodcastUpdate, findOrCreatePodcast } from '../lib/Podcast';
import { handleEpisodeUpdate, findOrCreateEpisode } from '../lib/Episode';
import { handleMetaUserUpdate } from '../lib/MetaUser';
import { emitUpdatedRatings, createNewEpisodeEvent } from '../Helpers/socket';
import { createEvent, formatPopulatedUser, formatPopulatedRating } from '../lib/Event';
import { fetchPodcastListenNotes } from '../Helpers/fetch';
import { findSubscriptions } from '../lib/Subscriptions';

export default {
  async create(req, res, io) {
    const { podcastId } = req.params;
    const { rating, target } = req.body;

    let ratingId;

    const user = await findUserById(req.userId).catch(error => error);

    if (user.errmsg) return res.status(404).json({ error: user });

    const podcast = await findOrCreatePodcast({ _id: podcastId }).catch(error => error);

    if (podcast.errmsg) return res.status(404).json({ error: podcast });

    const query = { episode: target._id, user: user.metaUser };

    const existingRating = await findOneRating(query).catch(error => error);

    if (!existingRating.errmsg) {
      const updatedRating = await updateRating(
        existingRating._id, { rating },
      ).catch(error => error);

      if (updatedRating.errmsg) return res.status(404).json({ error: updatedRating });
      ratingId = existingRating._id;
    } else {
      const episode = await findOrCreateEpisode(
        { _id: target._id, podcast: podcastId },
      ).catch(error => error);

      if (episode.errmsg) return res.status(404).json({ error: episode });

      if (!podcast.episodes.includes(episode._id)) {
        const updatedPodcast = await handlePodcastUpdate(
          podcast._id, { episodes: target._id },
        ).catch(error => error);

        if (updatedPodcast.errmsg) return res.status(404).json({ error: updatedPodcast });

        const subscriptions = findSubscriptions(
          { query: { _id: podcastId } },
        ).catch(error => error);

        if (!subscriptions.errmsg) {
          const listenNotesPodcast = await fetchPodcastListenNotes(podcastId).catch(error => error);

          if (!listenNotesPodcast.errmsg) {
            if (Array.isArray(listenNotesPodcast.episodes)) {
              if (target._id === listenNotesPodcast.episodes[0]._id) {
                createNewEpisodeEvent(io, listenNotesPodcast, req.userId);
              }
            }
          }
        }
      }

      const newRating = await createRating({
        _id: uuidv4(), rating, episode: target._id, user: user.metaUser,
      }).catch(error => error);

      if (newRating.errmsg) return res.status(404).json({ error: newRating });

      ratingId = newRating._id;

      const updatedEpisode = await handleEpisodeUpdate(
        target._id, { ratings: ratingId },
      ).catch(error => error);

      if (updatedEpisode.errmsg) return res.status(404).json({ error: updatedEpisode });

      const updatedMetaUser = await handleMetaUserUpdate(
        user.metaUser, { ratings: ratingId },
      ).catch(error => error);

      if (updatedMetaUser.errmsg) return res.status(404).json({ error: updatedMetaUser });
    }
    const podcastEpisodes = podcast.episodes;

    if (!podcastEpisodes.includes(target._id)) {
      podcastEpisodes.push(target._id);
    }

    emitUpdatedRatings(io, podcastId, podcastEpisodes, target._id);

    const newEvent = {
      agent: {
        kind: 'User',
        item: req.userId,
      },
      target: {
        kind: 'Episode',
        item: target._id,
      },
      object: {
        kind: 'Rating',
        item: ratingId,
      },
      type: 'rating',
    };

    const event = await createEvent(newEvent).catch(error => error);

    if (event.errmsg) return res.status(404).json(event);

    const updatedUser = await handleUserUpdate({ events: event._id }).catch(error => error);

    if (updatedUser.errmsg) return res.status(404).json(updatedUser);

    const eventCopy = JSON.parse(JSON.stringify(event));

    eventCopy.agent = formatPopulatedUser(event.agent);
    eventCopy.target = target;
    eventCopy.object = formatPopulatedRating(event.object);

    user.followers.map((follower) => {
      io.emit(`users/${follower}/event`, eventCopy);
      return follower;
    });

    return res.status(200).json({ info: 'Your rating has been registered' });
  },
};
