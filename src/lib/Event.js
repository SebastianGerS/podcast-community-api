import R from 'ramda';
import Event from '../Models/Event';

import {
  find, create,
} from '../Helpers/db';
/* eslint-disable import/prefer-default-export */
export const createEvent = R.partial(create, [Event]);
export const findEvents = R.partial(find, [Event, {
  _id: 1, type: 1, agent: 1, target: 1, object: 1, date: 1,
}]);

export function formatPopulatedEvent(event, object = event.object) {
  return {
    _id: event._id,
    type: event.type,
    agent: {
      _id: event.agent.item._id,
      name: event.agent.item.username,
      image: event.agent.item.profile_img.thumb,
      kind: event.agent.kind,
    },
    target: {
      _id: event.target.item._id,
      name: event.target.item.username,
      image: event.target.item.profile_img.thumb,
      kind: event.target.kind,
    },
    object,
    date: event.date,
  };
}

export function formatPopulatedUser(user) {
  return {
    _id: user.item._id,
    name: user.item.username,
    image: user.item.profile_img.thumb,
    kind: user.kind,
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
      if (event.object.item && !itemIds.includes(event.object.item)) {
        itemIds.push(event.object.item);
      }
    }

    if (event.target.kind === itemType && !itemIds.includes(event.target.item._id)) {
      itemIds.push(event.target.item._id);
    }

    if (event.agent.kind === itemType && !itemIds.includes(event.agent.item._id)) {
      itemIds.push(event.agent.item._id);
    }

    return event;
  });

  const stringOfItemIds = itemIds.reduce((ids, id, index) => {
    if (index === 0 && itemIds.length > 1) {
      return `${id},`;
    } if (index === itemIds.length - 1) {
      return `${ids},${id}`;
    }

    return `${ids},${id},`;
  });

  return stringOfItemIds;
}
