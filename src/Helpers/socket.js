import { findRatings } from '../lib/Rating';
import { getAvrage } from './general';
import { handleEpisodeUpdate } from '../lib/Episode';
import { handlePodcastUpdate } from '../lib/Podcast';
import {
  findUsers, handleUserUpdate, findUserById, getUserWithPopulatedFollows,
} from '../lib/User';
import {
  createEvent, extendObjectWithListenNotesItem, formatPopulatedUser, formatPopulatedEvent,
} from '../lib/Event';
import { createNotification } from '../lib/Notification';
import {
  findSessions, findOneSession, findAndUpdateSession, formatSessions,
} from '../lib/Session';

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
      item: listenNotesPodcast.id,
      kind: 'Podcast',
    },
    object: {
      item: listenNotesPodcast.episodes[0].id,
      kind: 'Episode',
    },
    type: 'newEpisode',
  };

  const newEvent = await createEvent(eventBody).catch(error => error);

  const querySubscribers = {
    query: {
      subscriptions: listenNotesPodcast.id,
    },
  };

  const subscribedUsers = await findUsers(querySubscribers).catch(error => error);

  if (Array.isArray(subscribedUsers)) {
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

        io.emit(`users/${user._id}/notification`, notificationCopy);
      }
      return user;
    });
  }
}

export async function emitUserSession(io, userId, session) {
  const query = { $or: [{ following: userId }, { followers: userId }] };

  const users = await findUsers({ query }).catch(error => error);
  if (Array.isArray(users)) {
    users.map((user) => {
      io.emit(`users/${user._id}/follow/online`, session);
      return user;
    });
  }
}

export async function updateAndEmitSession(io, userId, online, episode = undefined) {
  const session = await findOneSession({ user: userId }).catch(error => error);

  if (!session.errmsg) {
    const sessionBody = online ? { online } : { online, listening_to: null };

    if (episode !== undefined) {
      sessionBody.listening_to = episode ? episode.id : null;
    }

    const updatedSession = await findAndUpdateSession(
      session.id,
      sessionBody,
    ).catch(error => error);

    const sessionCopy = JSON.parse(JSON.stringify(updatedSession));

    if (episode !== undefined) {
      sessionCopy.listening_to = episode;
    }
    emitUserSession(io, userId, sessionCopy);
  }
}

export async function emitFollowSessions(io, userId) {
  const user = await findUserById(userId).catch(error => error);

  if (!user.errmsg) {
    const query = {
      user: {
        $in: [...user.followers, ...user.following],
      },
      online: true,
    };
    const sessions = await findSessions({ query }).catch(error => error);

    const onlineFollows = sessions.errmsg ? [] : await formatSessions(sessions);

    io.emit(`users/${userId}/follows/online`, onlineFollows);
  }
}

/* eslint-disable no-console */
export function sockets(io) {
  const onlineUsers = [];

  io.on('connection', (socket) => {
    console.log(`${io.engine.clientsCount} client(s) connected`);

    socket.on('disconnect', () => {
      console.log(`${io.engine.clientsCount} client(s) connected`);
    });

    socket.on('user/online', (userId) => {
      if (!onlineUsers.includes(userId)) {
        updateAndEmitSession(io, userId, true);
        emitFollowSessions(io, userId);
      }

      onlineUsers.push(userId);

      console.log(`${onlineUsers.length} user(s) online`);

      socket.on('disconnect', () => {
        const indexOfUserId = onlineUsers.indexOf(userId);
        onlineUsers.splice(indexOfUserId, 1);

        if (!onlineUsers.includes(userId)) {
          updateAndEmitSession(io, userId, false);
        }

        console.log(`${onlineUsers.length} user(s) online`);
      });
    });

    socket.on('user/follows/status', (userId) => {
      emitFollowSessions(io, userId);
    });

    socket.on('user/listening', (episode, userId) => {
      updateAndEmitSession(io, userId, true, episode);
    });
  });
}

async function handleStatusEmitionForEvents(event, io) {
  const emitionEventTypes = ['unfollow', 'remove'];

  if (emitionEventTypes.includes(event)) {
    const targetId = event.target.item._id;
    const agentId = event.agent.item._id;

    const agentUser = await findUserById(agentId).catch(error => error);

    if (!agentUser.followers(targetId) && !agentUser.following(targetId)) {
      io.emit(`users/${agentId}/follow/online`, { userId: targetId, online: false });
    }

    const targetUser = await findUserById(targetId).catch(error => error);

    if (!targetUser.followers(targetId) && !targetUser.following(agentId)) {
      io.emit(`users/${targetId}/follow/online`, { userId: agentId, online: false });
    }
  }
}

export async function handleFollowUppdateEmitions(event, io) {
  const emitionEventTypes = ['follow', 'unfollow', 'request', 'unrequest', 'confirm', 'reject', 'remove'];

  if (emitionEventTypes.includes(event.type)) {
    const targetId = event.target.item._id;
    const agentId = event.agent.item._id;

    const targetUserFollows = await getUserWithPopulatedFollows(targetId).catch(error => error);

    if (!targetUserFollows.errmsg) {
      io.emit(`users/${targetId}/follows`, targetUserFollows);
    }

    const agentUserFollows = await getUserWithPopulatedFollows(agentId).catch(error => error);
    if (!agentUserFollows.errmsg) {
      io.emit(`users/${agentId}/follows`, agentUserFollows);
    }

    const agentUser = await findUsers({ query: { _id: agentId } }).catch(error => error);
    if (Array.isArray(agentUser)) {
      io.emit(`users/${agentId}`, agentUser[0]);
    }

    const targetUser = await findUsers({ query: { _id: targetId } }).catch(error => error);
    if (Array.isArray(targetUser)) {
      io.emit(`users/${targetId}`, targetUser[0]);
    }
  }

  handleStatusEmitionForEvents(event, io);
}

export async function handleEventEmitions(user, event, target, object, io) {
  const eventEmitionTypes = ['confirm', 'follow', 'recommend', 'subscribe'];

  if (eventEmitionTypes.includes(event.type)) {
    let eventCopy = JSON.parse(JSON.stringify(event));

    if (eventCopy.target.kind === 'Podcast') {
      eventCopy.target = target;
      eventCopy.agent = formatPopulatedUser(eventCopy.agent);
    } else {
      eventCopy = formatPopulatedEvent(eventCopy, object);
    }

    user.followers.map((follower) => {
      if (follower !== eventCopy.target._id) {
        io.emit(`users/${follower}/event`, eventCopy);
      }
      return follower;
    });
  }
}
