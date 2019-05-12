import R from 'ramda';
import Event from '../Models/Event';
import {
  find, create, deleteMany,
} from '../Helpers/db';
import { reduceToString } from '../Helpers/general';
import { findOrCreatePodcast } from './Podcast';
import { deleteSubscription, findSubscriptionById, createSubscription } from './Subscriptions';
import { fetchAndEmitToSubscribers } from '../Helpers/fetch';
import { findUsers } from './User';

export const createEvent = R.partial(create, [Event]);
export const findEvents = R.partial(find, [Event, {
  _id: 1, type: 1, agent: 1, target: 1, object: 1, date: 1,
}]);
export const deleteEvents = R.partial(deleteMany, [Event]);

export function formatPopulatedEvent(event, object = event.object) {
  const eventCopy = JSON.parse(JSON.stringify(event));
  const objectCopy = JSON.parse(JSON.stringify(object));

  return {
    _id: eventCopy._id,
    type: eventCopy.type,
    agent: {
      _id: eventCopy.agent.item._id,
      name: eventCopy.agent.item.username,
      image: eventCopy.agent.item.profile_img.thumb,
      kind: eventCopy.agent.kind,
    },
    target: {
      _id: eventCopy.target.item._id,
      name: eventCopy.target.item.username,
      image: eventCopy.target.item.profile_img.thumb,
      kind: eventCopy.target.kind,
    },
    object: objectCopy,
    date: eventCopy.date,
  };
}

export function formatPopulatedUser(user) {
  const userCopy = JSON.parse(JSON.stringify(user));

  return {
    _id: userCopy.item._id,
    name: userCopy.item.username,
    image: userCopy.item.profile_img.thumb,
    kind: userCopy.kind,
  };
}

export function formatPopulatedRating(rating) {
  if (rating.rating) return rating;
  const ratingCopy = JSON.parse(JSON.stringify(rating));

  return {
    _id: ratingCopy.item._id,
    rating: ratingCopy.item.rating,
    kind: ratingCopy.kind,
  };
}

export function extendObjectWithListenNotesItem(object, listenNotesItem) {
  return {
    _id: object.item._id ? object.item._id : object.item,
    kind: object.kind,
    image: listenNotesItem.image,
    name: listenNotesItem.title,
    parent_name: listenNotesItem.podcast
      ? listenNotesItem.podcast.title
      : listenNotesItem.podcast_title,
  };
}

export function extractItemIds(eventsWithItems, itemType) {
  const itemIds = [];

  eventsWithItems.map((event) => {
    if (event.object) {
      if (event.object.kind === itemType && !itemIds.includes(event.object.item._id)) {
        itemIds.push(event.object.item._id);
      }
    }

    if (event.target) {
      if (event.target.kind === itemType && !itemIds.includes(event.target.item._id)) {
        itemIds.push(event.target.item._id);
      }
    }

    if (event.agent.kind === itemType && !itemIds.includes(event.agent.item._id)) {
      itemIds.push(event.agent.item._id);
    }

    return event;
  });

  const stringOfItemIds = reduceToString(itemIds, ',');

  return stringOfItemIds;
}

export async function handleSubscribe(podcastId, userId, io) {
  const podcast = await findOrCreatePodcast({ _id: podcastId }).catch(error => error);

  if (podcast.errmsg) return podcast;

  const subscription = await findSubscriptionById(podcastId).catch(error => error);

  if (subscription.errmsg) {
    const newSubscription = await createSubscription({ _id: podcastId }).catch(error => error);
    if (newSubscription.errmsg) return newSubscription;

    await fetchAndEmitToSubscribers(io, podcastId, userId);
  }

  return true;
}

export async function handleUnsubscribe(podcastId, userId) {
  const querySubscribers = {
    query: {
      _id: { $ne: userId }, subscriptions: podcastId,
    },
  };

  const subscribedUsers = await findUsers(querySubscribers).catch(error => error);

  if (Array.isArray(subscribedUsers)) {
    await deleteSubscription(podcastId).catch(error => error);
  }
}
