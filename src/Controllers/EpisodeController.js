import { fetchEpisodeListenNotes } from '../Helpers/fetch';
import { findOrCreateEpisode } from '../lib/Episode';

export default {
  async findOne(req, res) {
    const { episodeId } = req.params;

    const lnEpisode = await fetchEpisodeListenNotes(episodeId);

    if (lnEpisode.errmsg) return res.status(lnEpisode.status).json({ error: lnEpisode });

    const episode = await findOrCreateEpisode({ _id: episodeId, podcast: lnEpisode.podcast.id });

    if (episode.errmsg) return res.status(404).json({ error: episode });

    lnEpisode.podcast_id = lnEpisode.podcast.id;
    lnEpisode.avrageRating = episode.avrageRating;

    return res.status(200).json({ episode: lnEpisode });
  },
};
