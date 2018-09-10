import fetchFromListenNotes from '../Helpers/fetch';
import { findUsers } from '../lib/User';

export default {
  async find(req, res) {
    let response;
    if (req.query.type !== 'user') {
      response = await fetchFromListenNotes(req.query);

      if (response.results.length === 0) return res.status(404).json({ error: { errmsg: 'no results where found' } });
    } else {
      const query = {
        $or: [{ email: new RegExp(req.query.term, 'i') }, { username: new RegExp(req.query.term, 'i') }],
      };
      const options = {
        skip: +req.query.offset,
      };

      response = await findUsers({ query, options }).catch(error => error);

      if (response.errmsg) return res.status(404).json({ error: response });
    }
    return res.status(200).json(response);
  },
};
