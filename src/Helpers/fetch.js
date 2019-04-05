/* eslint-disable global-require */
import Axios from 'axios';

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

export function replaceObjectOnNotification(notification, object) {
  return {
    _id: notification._id,
    user: notification.user,
    event: {
      type: notification.event.type,
      agent: notification.event.agent,
      target: notification.event.target,
      object,
      date: notification.event.date,
    },
    observed: notification.observed,
    date: notification.date,
  };
}

function extendObjectWithListenNotesItem(object, listenNotesItem) {
  return {
    item: object.item,
    kind: object.kind,
    image: listenNotesItem.image,
    title: listenNotesItem.title,
    podcast_title: listenNotesItem.podcast ? listenNotesItem.podcast.title : undefined,
  };
}

export async function populateNotificationsWithListenNotesData(notifications) {
  const response = await Promise.all(notifications.map(
    async (notification) => {
      let notificationCopy = notification;
      let object;
      let fetchedItem;

      const { kind, item } = notification.event.object;

      switch (kind) {
        case 'Episode':
          fetchedItem = await fetchEpisodeListenNotes(item).catch(error => error);

          object = extendObjectWithListenNotesItem(notification.event.object, fetchedItem);

          notificationCopy = replaceObjectOnNotification(notification, object);
          break;
        case 'Podcast':
          fetchedItem = await fetchPodcastListenNotes(item).catch(error => error);

          object = extendObjectWithListenNotesItem(notification.event.object, fetchedItem);

          notificationCopy = replaceObjectOnNotification(notification, object);
          break;
        default:
          break;
      }

      return notificationCopy;
    },
  ));

  return response;
}
