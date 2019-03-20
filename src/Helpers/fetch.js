/* eslint-disable global-require */
import Axios from 'axios';

if (!process.env.JWT_SECRET) {
  require('dotenv').config();
}

export async function fetchFromListenNotes(path, query) {
  const headers = {
    'X-Mashape-Host': process.env.X_MASHAPE_HOST,
    'X-Mashape-key': process.env.X_MASHAPE_KEY,
  };

  try {
    const response = await new Promise((resolve, reject) => {
      Axios.get(`${process.env.X_MASHAPE_BASE_URL}/${path}${query}`, { method: 'GET', headers })
        .then((data) => {
          resolve(data.data);
        })
        .then(data => resolve(data)).catch(error => reject(error));
    });

    return response;
  } catch (error) {
    const listenNotesError = new Error();

    listenNotesError.errmsg = error.response ? error.response.statusText : 'Unknow error occured when trying send a request to the ListenNotes api';
    listenNotesError.status = error.status;

    return listenNotesError;
  }
}

export async function searchListenNotes(query) {
  const {
    term, type, offset, ocid, sortByDate,
  } = query;

  const escapedTerm = encodeURI(term);

  const response = await fetchFromListenNotes('search', `?q=${escapedTerm}&type=${type}&offset=${offset}${sortByDate ? '&sort_by_date=1' : ''}${ocid ? `&ocid=${ocid}` : ''}`);

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
