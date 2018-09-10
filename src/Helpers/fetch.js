/* eslint-disable global-require */
import Axios from 'axios';

if (!process.env.JWT_SECRET) {
  require('dotenv').config();
}


export default async function fetchFromListenNotes(query) {
  const headers = {
    'X-Mashape-Host': process.env.X_MASHAPE_HOST,
    'X-Mashape-key': process.env.X_MASHAPE_KEY,
  };
  const { term, type, offset } = query;

  const response = await new Promise((resolve, reject) => {
    Axios.get(`${process.env.X_MASHAPE_BASE_URL}/search?q=${term}&type=${type}&offset=${offset}`, { method: 'GET', headers })
      .then((data) => {
        resolve(data.data);
      })
      .then(data => resolve(data)).catch(error => reject(error));
  });
  return response;
}
