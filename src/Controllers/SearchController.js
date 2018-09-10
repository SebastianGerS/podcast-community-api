import fetchFromListenNotes from '../Helpers/fetch';
import { findUsers } from '../lib/User';

export default {
  async find(req, res) {
    let response;
    if (req.query.type !== 'user') {
      response = await fetchFromListenNotes(req.query);

      if (response.results.length === 0) return res.status(404).json({ error: { errmsg: 'no results where found' } });

      response.morePages = response.total - (response.next_offset - 10) !== response.count;
    } else {
      const { term, offset } = req.query;
      const query = {
        $or: [{ email: new RegExp(term, 'i') }, { username: new RegExp(term, 'i') }],
      };
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
        next_offset: morePages ? skip + limit : null,
        count,
        results: partialResponse,
        total,
      };
    }
    return res.status(200).json(response);
  },
};
