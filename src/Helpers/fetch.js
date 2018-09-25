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

  const response = await new Promise((resolve, reject) => {
    Axios.get(`${process.env.X_MASHAPE_BASE_URL}/${path}/${query}`, { method: 'GET', headers })
      .then((data) => {
        resolve(data.data);
      })
      .then(data => resolve(data)).catch(error => reject(error));
  });
  return response;
}

export async function searchListenNotes(query) {
  const { term, type, offset } = query;

  const response = await fetchFromListenNotes('/search', `?q=${term}&type=${type}&offset=${offset}`);

  return response;
}

export async function fetchPodcastListenNotes(podcastId) {
  const response = await fetchFromListenNotes('/podcasts/', podcastId);

  return response;
}
