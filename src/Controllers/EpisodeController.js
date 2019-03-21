import { fetchEpisodeListenNotes } from '../Helpers/fetch';
import { removeHtmlFromString } from '../Helpers/general';

export default {
  async findOne(req, res) {
    const response = await fetchEpisodeListenNotes(req.params.episodeId);

    if (response.errmsg) return res.status(response.status).json({ error: response });

    response.description = removeHtmlFromString(response.description);
    response.podcast_id = response.podcast.id;

    return res.status(200).json(response);
  },
};
