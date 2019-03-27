import { searchListenNotes, fetchFromListenNotes } from '../Helpers/fetch';
import { findUsers } from '../lib/User';

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
      } else {
        return res.status(404).json({ error: response });
      }
    } else {
      const { term, offset, filters } = req.query;

      const decodedFilters = filters ? JSON.parse((decodeURIComponent(filters))) : { };

      const query = decodedFilters.field ? { [`${decodedFilters.field}`]: new RegExp(term, 'i') }
        : { $or: [{ email: new RegExp(term, 'i') }, { username: new RegExp(term, 'i') }] };
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
