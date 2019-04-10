import jwt from 'jsonwebtoken';
import { searchListenNotes, fetchFromListenNotes } from '../Helpers/fetch';
import { findUsers } from '../lib/User';
import { findEpisodes } from '../lib/Episode';
import { findPodcasts } from '../lib/Podcast';

export default {
  async find(req, res) {
    let response;
    if (req.query.type !== 'user') {
      response = await searchListenNotes(req.query);

      response.morePages = (response.total - response.next_offset) > 0;
      response.term = req.query.term;

      if (response.results) {
        if (response.results.length === 0) {
          response.error = new Error();
          response.error.errmsg = 'No results where found';
          return res.status(404).json(response);
        }

        const itemIds = response.results.map(item => item.id);
        if (req.query.type === 'episode') {
          const episodes = await findEpisodes({ query: { _id: { $in: itemIds } } })
            .catch(error => error);
          const episodeRatings = episodes.length > 0
            ? episodes.map(episode => ({ episodeId: episode._id, rating: episode.avrageRating }))
            : [];

          response.ratings = episodeRatings;
        } else if (req.query.type === 'podcast') {
          const podcasts = await findPodcasts({ query: { _id: { $in: itemIds } } })
            .catch(error => error);
          const podcastsRatings = podcasts.length > 0
            ? podcasts.map(podcast => ({ podcastId: podcast._id, rating: podcast.avrageRating }))
            : [];
          response.ratings = podcastsRatings;
        }
      } else {
        return res.status(404).json({ error: response });
      }
    } else {
      let userId;

      if (req.headers.authorization) {
        userId = jwt.verify(req.headers.authorization, process.env.JWT_SECRET, (error, decoded) => {
          if (error) {
            const JsonWebTokenError = new Error();
            JsonWebTokenError.errmsg = error.message;
            return res.status(500).json({ error: JsonWebTokenError, message: 'Error during authentification of token' });
          }
          return decoded.user._id;
        });
      }

      const { term, offset, filters } = req.query;

      const decodedFilters = filters ? JSON.parse((decodeURIComponent(filters))) : { };

      const query = decodedFilters.field ? { [`${decodedFilters.field}`]: new RegExp(term, 'i'), _id: { $ne: userId } }
        : { $or: [{ email: new RegExp(term, 'i') }, { username: new RegExp(term, 'i') }], _id: { $ne: userId } };
      const limit = 10;

      const skip = +offset;

      const partialResponse = await findUsers({ query, skip, limit }).catch(error => error);

      if (partialResponse.errmsg) return res.status(404).json({ error: partialResponse });

      const fullResponse = await findUsers({ query }).catch(error => error);

      if (fullResponse.errmsg) return res.status(404).json({ error: partialResponse });

      const total = fullResponse.length;

      const count = partialResponse.length;

      const morePages = total - skip !== count;

      response = {
        morePages,
        next_offset: skip + limit,
        count,
        results: partialResponse,
        total,
        term,
      };
    }
    return res.status(200).json(response);
  },
  async getFilters(req, res) {
    const response = {};

    const genres = await fetchFromListenNotes('genres', '');

    if (genres.errmsg) return res.status(404).json({ error: genres });

    const languages = await fetchFromListenNotes('languages', '');

    if (languages.errmsg) return res.status(404).json({ error: languages });

    response.genres = genres.genres.map(genre => ({ name: genre.name, value: genre.id }));
    response.languages = languages.languages;

    return res.status(200).json(response);
  },
};
