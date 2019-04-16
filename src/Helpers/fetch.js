/* eslint-disable global-require */
import Axios from 'axios';
import R from 'ramda';
import {
  extendObjectWithListenNotesItem, formatPopulatedEvent, formatPopulatedUser,
  extractItemIds, formatPopulatedRating,
} from '../lib/Event';
import { OrderByDate } from './general';
import { updateSubscription } from '../lib/Subscriptions';
import { findEpisodeById, createEpisode } from '../lib/Episode';
import { handlePodcastUpdate } from '../lib/Podcast';
import { createNewEpisodeEvent } from './socket';

if (!process.env.JWT_SECRET) {
  require('dotenv').config();
}

export async function fetchFromListenNotes(path, query) {
  const headers = {
    'X-ListenAPI-key': process.env.X_LISTENAPI_KEY,
  };

  try {
    const response = await new Promise((resolve, reject) => {
      Axios.get(`${process.env.X_LISTENAPI_BASE_URL}/${path}${query}`, { method: 'GET', headers })
        .then((data) => {
          resolve(data.data);
        })
        .then(data => resolve(data)).catch(error => reject(error));
    });

    return response;
  } catch (error) {
    const listenNotesError = new Error();

    listenNotesError.errmsg = error.response ? error.response.statusText : 'Unknow error occured when trying send a request to the ListenNotes api';
    listenNotesError.status = 404;

    return listenNotesError;
  }
}

export async function postToListenNotes(path, body) {
  const headers = {
    'X-ListenAPI-key': process.env.X_LISTENAPI_KEY,
  };

  try {
    const response = await new Promise((resolve, reject) => {
      Axios.post(`${process.env.X_LISTENAPI_BASE_URL}/${path}`, body, { method: 'POST', headers })
        .then((data) => {
          resolve(data.data);
        })
        .then(data => resolve(data)).catch(error => reject(error));
    });

    return response;
  } catch (error) {
    const listenNotesError = new Error();

    listenNotesError.errmsg = error.response ? error.response.statusText : 'Unknow error occured when trying send a request to the ListenNotes api';
    listenNotesError.status = 404;

    return listenNotesError;
  }
}

export async function searchListenNotes(query) {
  const {
    term, type, offset, filters, ocid, sorting,
  } = query;

  const escapedTerm = encodeURI(term);

  const decodedFilters = filters ? JSON.parse((decodeURIComponent(filters))) : { genres: [] };

  const genreIds = decodedFilters.genres.length !== 0
    ? decodedFilters.genres.map(genre => genre.value)
    : undefined;
  const field = decodedFilters.field ? decodedFilters.field : undefined;
  const language = decodedFilters.language ? decodedFilters.language : undefined;
  const minLength = decodedFilters.len_min !== '' ? decodedFilters.len_min : undefined;
  const maxLength = decodedFilters.len_max !== '' ? decodedFilters.len_max : undefined;

  const listenNotesQuery = (
    `?q=${escapedTerm}&type=${type}&offset=${offset}`
    + `${genreIds ? `&genre_ids=${genreIds}` : ''}`
    + `${field ? `&only_in=${field}` : ''}`
    + `${language ? `&language=${language}` : ''}`
    + `${minLength ? `&len_min=${minLength}` : ''}`
    + `${maxLength ? `&len_max=${maxLength}` : ''}`
    + `${sorting ? `&sort_by_date=${sorting}` : ''}`
    + `${ocid ? `&ocid=${ocid}` : ''}`
  );

  const response = await fetchFromListenNotes('search', listenNotesQuery);

  return response;
}

export async function fetchPodcastListenNotes(podcastId) {
  const response = await fetchFromListenNotes('podcasts/', podcastId);

  return response;
}

export async function getTopPodcasts() {
  const response = await fetchFromListenNotes('best_podcasts', '?page=1');
  return response;
}

export async function fetchEpisodeListenNotes(episodeId) {
  const response = await fetchFromListenNotes('episodes/', episodeId);

  return response;
}
export async function fetchPodcastsListenNotes(podcastIds) {
  const response = await postToListenNotes('podcasts/', podcastIds).then(res => res.podcasts);

  return response;
}

export async function fetchEpisodesListenNotes(episodeIds) {
  const response = await postToListenNotes('episodes/', episodeIds).then(res => res.episodes);

  return response;
}

function mergeEventWithListenNotesData(eventsWithItems, fetchedItems, itemType) {
  const formatedItemEvents = eventsWithItems.map((event) => {
    const eventCopy = JSON.parse(JSON.stringify(event));

    fetchedItems.map((item) => {
      if (event.object) {
        if (event.object.item) {
          if (item.id === event.object.item._id) {
            eventCopy.object = extendObjectWithListenNotesItem(event.object, item);
          }
        }
      }

      if (event.target) {
        if (event.target.kind === itemType) {
          if (item.id === event.target.item._id) {
            eventCopy.target = extendObjectWithListenNotesItem(event.target, item);
          }
        }
      }

      if (event.agent.kind === itemType) {
        if (item.id === event.agent.item._id) {
          eventCopy.agent = extendObjectWithListenNotesItem(event.agent, item);
        }
      }

      return item;
    });

    if (event.agent.kind === 'User') {
      eventCopy.agent = formatPopulatedUser(event.agent);
    } else if (event.agent.kind === 'Podcast' && itemType !== 'Podcast') {
      eventCopy.agent = {
        _id: event.agent.item._id,
        kind: event.agent.kind,
      };
    }

    if (event.target) {
      if (event.target.kind === 'User') {
        eventCopy.target = formatPopulatedUser(event.target);
      }
    }

    if (event.object.kind === 'Rating') {
      eventCopy.object = formatPopulatedRating(event.object);
    } else if (event.object.kind === 'Episode' && itemType !== 'Episode') {
      eventCopy.object = {
        _id: event.object.item._id,
        kind: event.object.kind,
      };
    }
    return eventCopy;
  });

  return formatedItemEvents;
}

export async function formatEvents(events) {
  const eventsWithEpisode = events.filter(event => event.object.kind === 'Episode' || event.target.kind === 'Episode');

  const eventsWithPodcast = events.filter(event => event.object.kind === 'Podcast' || event.target.kind === 'Podcast' || event.agent.kind === 'Podcast');

  const eventsWithoutObject = events.filter(event => (!event.object.kind && event.agent.kind === 'User' && event.target.kind === 'User'));
  const formatedEvents = [];

  if (eventsWithEpisode.length > 0) {
    const stringifiedIds = extractItemIds(eventsWithEpisode, 'Episode');

    const fetchedItems = await fetchEpisodesListenNotes(`ids=${stringifiedIds}`).catch(error => error);

    const formatedEpisodeEvents = mergeEventWithListenNotesData(eventsWithEpisode, fetchedItems, 'Episode');

    formatedEvents.push(...formatedEpisodeEvents);
  }

  if (eventsWithPodcast.length > 0) {
    const stringifiedIds = extractItemIds(eventsWithPodcast, 'Podcast');

    const fetchedItems = await fetchPodcastsListenNotes(`ids=${stringifiedIds}`).catch(error => error);

    const formatedPodcastEvents = mergeEventWithListenNotesData(eventsWithPodcast, fetchedItems, 'Podcast');

    formatedEvents.push(...formatedPodcastEvents);
  }

  formatedEvents.push(...eventsWithoutObject.map(event => formatPopulatedEvent(event)));

  const mergedEvents = [];
  const mergedEventIds = [];

  formatedEvents.map((eventOuter, oIndex) => {
    let eventCopy = eventOuter;
    formatedEvents.map((eventInner, iIndex) => {
      if (eventOuter._id === eventInner._id && oIndex !== iIndex) {
        eventCopy = R.mergeDeepRight(eventOuter, eventInner);
      }
      return eventInner;
    });

    if (!mergedEventIds.includes(eventCopy._id)) {
      mergedEvents.push(eventCopy);
      mergedEventIds.push(eventCopy._id);
    }

    return eventCopy;
  });

  return OrderByDate(mergedEvents);
}


export async function formatNotifications(notifications) {
  const events = notifications.map(notification => notification.event);

  const formatedEvents = await formatEvents(events);

  const formatedNotifications = notifications.map((notification) => {
    const notificationCopy = JSON.parse(JSON.stringify(notification));

    formatedEvents.map((event) => {
      if (event._id === notificationCopy.event._id) {
        notificationCopy.event = event;
      }

      return event;
    });

    return notificationCopy;
  });

  return formatedNotifications;
}

export const mapRatingsToListenNoteResults = (listenNotesItems, itemsWidthRatings) => {
  const resultsWithRatings = [...listenNotesItems.map((lsItem) => {
    const lsItemCopy = lsItem;

    itemsWidthRatings.map((item) => {
      if (lsItemCopy.id === item._id) {
        lsItemCopy.avrageRating = item.avrageRating;
      }
      return item;
    });

    return lsItemCopy;
  })];

  return resultsWithRatings;
};


export async function fetchAndEmitToSubscribers(io, podcastId, userId = undefined) {
  const listenNotesPodcast = await fetchPodcastListenNotes(podcastId).catch(error => error);

  if (!listenNotesPodcast.errmsg) {
    updateSubscription(podcastId, { updated_at: Date.now() }).catch(error => error);

    const latestEpisodeId = listenNotesPodcast.episodes[0].id;

    const episode = await findEpisodeById(latestEpisodeId).catch(error => error);

    if (episode.errmsg) {
      const newEpisode = await createEpisode(
        { _id: latestEpisodeId, podcast: podcastId },
      ).catch(error => error);

      if (newEpisode.errmsg) return newEpisode;

      const updatedPodcast = await handlePodcastUpdate(podcastId,
        { episodes: newEpisode._id }).catch(error => error);

      if (updatedPodcast.errmsg) return updatedPodcast;

      createNewEpisodeEvent(io, listenNotesPodcast, userId);
    }
  }

  return true;
}
