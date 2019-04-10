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
      kind: event.agent.item.kind,
    },
    target: {
      _id: event.target.item._id,
      name: event.target.item.username,
      image: event.target.item.profile_img.thumb,
      kind: event.target.item.kind,
    },
    object,
    date: event.date,
  };
}

export function extendObjectWithListenNotesItem(object, listenNotesItem) {
  return {
    _id: object.item,
    kind: object.kind,
    image: listenNotesItem.image,
    name: listenNotesItem.title,
    parent_name: listenNotesItem.podcast ? listenNotesItem.podcast.title : undefined,
  };
}
