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
