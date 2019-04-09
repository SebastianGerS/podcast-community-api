import { fetchEpisodeListenNotes } from '../Helpers/fetch';
import { removeHtmlFromString } from '../Helpers/general';
import { findOrCreateEpisode } from '../lib/Episode';

export default {
  async findOne(req, res) {
    const { episodeId } = req.params;

    const response = {};

    const lnEpisode = await fetchEpisodeListenNotes(episodeId);

    if (lnEpisode.errmsg) return res.status(lnEpisode.status).json({ error: lnEpisode });

    lnEpisode.description = removeHtmlFromString(lnEpisode.description);
    lnEpisode.podcast_id = lnEpisode.podcast.id;

    response.episode = lnEpisode;

    const episode = await findOrCreateEpisode({ _id: episodeId, podcast: lnEpisode.podcast_id });

    if (episode.errmsg) return res.status(404).json({ error: episode });

    response.avrageRating = episode.avrageRating;

    return res.status(200).json(response);
  },
};
