import { findRatings } from '../lib/Rating';
import { getAvrage } from './general';
import { handleEpisodeUpdate } from '../lib/Episode';
import { handlePodcastUpdate } from '../lib/Podcast';
import { findUsers, handleUserUpdate } from '../lib/User';
import { createEvent, extendObjectWithListenNotesItem } from '../lib/Event';
import { createNotification } from '../lib/Notification';

export async function emitUpdatedRatings(io, podcastId, podcastEpisodes, episodeId) {
  const episodeRatings = await findRatings({ query: { episode: episodeId } }).catch(error => error);

  if (episodeRatings.errmsg) return { error: episodeRatings };

  const avrageEpisodeRating = getAvrage(episodeRatings, 'rating');

  const updatedEpisode = await handleEpisodeUpdate(
    episodeId,
    { avrageRating: avrageEpisodeRating },
  ).catch(error => error);

  if (updatedEpisode.errmsg) return { error: updatedEpisode };

  io.emit(`episodes/${episodeId}/rating`, { itemId: episodeId, rating: avrageEpisodeRating });

  const query = { query: { episode: { $in: podcastEpisodes } } };

  const podcastRatings = await findRatings(query).catch(error => error);

  if (podcastRatings.errmsg) return { error: podcastRatings };

  const avragePodcastRating = getAvrage(podcastRatings, 'rating');

  const updatedPodcast = await handlePodcastUpdate(
    podcastId,
    { avrageRating: avragePodcastRating },
  ).catch(error => error);

  if (updatedPodcast.errmsg) return { error: updatedPodcast };

  io.emit(`podcasts/${podcastId}/rating`, { itemId: podcastId, rating: avragePodcastRating });

  return { info: 'success' };
}

export async function createNewEpisodeEvent(io, listenNotesPodcast, userId = undefined) {
  const eventBody = {
    agent: {
      item: listenNotesPodcast._id,
      kind: 'Podcast',
    },
    object: {
      item: listenNotesPodcast.episodes[0]._id,
      kind: 'Episode',
    },
    type: 'newEpisode',
  };

  const newEvent = await createEvent(eventBody).catch(error => error);

  const querySubscribers = {
    query: {
      subscriptions: listenNotesPodcast._id,
    },
  };

  const subscribedUsers = await findUsers(querySubscribers).catch(error => error);

  subscribedUsers.map(async (user) => {
    if (user._id !== userId) {
      const newNotification = await createNotification(
        { user: user._id, event: newEvent._id },
      ).catch(error => error);

      const updateUser = await handleUserUpdate(user._id,
        { events: newEvent._id, notifications: newNotification._id }).catch(error => error);

      if (updateUser.errmsg) return updateUser;
      const notificationCopy = JSON.parse(JSON.stringify(newNotification));

      const agent = extendObjectWithListenNotesItem(newEvent.agent, listenNotesPodcast);
      const object = extendObjectWithListenNotesItem(
        newEvent.object, listenNotesPodcast.episodes[0],
      );

      notificationCopy.event = {
        _id: notificationCopy.event._id,
        agent,
        object,
        type: notificationCopy.event.type,
      };

      io.emit(`user/${user._id}/notification`, notificationCopy);
    }
    return user;
  });
}
