import { findUserById } from '../lib/User';
import { findCategories } from '../lib/Category';
import {
  fetchPodcastListenNotes, getTopPodcasts, fetchPodcastsListenNotes, mapRatingsToListenNoteResults,
} from '../Helpers/fetch';
import { findOrCreatePodcast, findPodcasts } from '../lib/Podcast';
import { reduceToString } from '../Helpers/general';
import { findEpisodes } from '../lib/Episode';

export default {
  async find(req, res) {
    const response = {};
    let status = 404;

    const user = await findUserById(req.params.userId).catch(error => error);

    if (user.errmsg) return res.status(404).json({ error: user });

    if (user.subscriptions.length > 0) {
      const podcastIds = reduceToString(user.subscriptions, ',');

      const subscriptions = await fetchPodcastsListenNotes(`ids=${podcastIds}`).catch(error => error);

      if (subscriptions.errmsg || subscriptions.length === 0) {
        return res.status(404).json({ error: { errmsg: 'Not Found' } });
      }

      const podcasts = await findPodcasts({ query: { _id: { $in: user.subscriptions } } });

      response.subscriptions = Array.isArray(podcasts)
        ? mapRatingsToListenNoteResults(subscriptions, podcasts)
        : [];

      const categories = await findCategories({
        query: { _id: { $in: user.categories } },
      }).catch(error => error);

      const categoriesWithPodcasts = Array.isArray(categories) ? categories.map((category) => {
        const categoryWithPodcasts = {};
        categoryWithPodcasts.name = category.name;
        categoryWithPodcasts._id = category._id;
        const includedIds = subscriptions.map(
          podcast => podcast.id,
        ).filter(id => category.podcasts.includes(id));

        const includedPodcasts = subscriptions.filter(subscription => (
          includedIds.includes(subscription.id)
        ));

        if (includedPodcasts) {
          categoryWithPodcasts.podcasts = includedPodcasts;
        } else {
          categoryWithPodcasts.podcasts = [];
        }

        return categoryWithPodcasts;
      })
        : [];

      response.categories = categoriesWithPodcasts;

      status = 200;
    }

    return res.status(status).json(response);
  },
  async getTopList(req, res) {
    const response = await getTopPodcasts().catch(error => error);
    if (response.errmsg) return res.status(response.status).json({ error: response });
    return res.status(200).json(response.channels);
  },
  async findOne(req, res) {
    const { podcastId } = req.params;
    const { offset } = req.query;
    const response = {};

    const lnPodcast = await fetchPodcastListenNotes(podcastId, offset);
    if (lnPodcast.errmsg) return res.status(lnPodcast.status).json({ error: lnPodcast });

    if (!offset) {
      response.podcast = lnPodcast;
      const podcast = await findOrCreatePodcast({ _id: podcastId }).catch(error => error);

      if (podcast.errmsg) return res.status(podcast.status).json({ error: podcast });

      response.podcast.avrageRating = podcast.avrageRating;
    }

    const itemIds = lnPodcast.episodes.map(item => item.id);
    const episodes = await findEpisodes({ query: { _id: { $in: itemIds } } })
      .catch(error => error);

    response.episodes = Array.isArray(episodes)
      ? mapRatingsToListenNoteResults(lnPodcast.episodes, episodes)
      : lnPodcast.episodes;

    response.episodes = response.episodes.map((episode) => {
      const episodeCopy = episode;

      episodeCopy.podcast_title = lnPodcast.title;

      return episodeCopy;
    });

    response.nextOffset = lnPodcast.next_episode_pub_date
      ? lnPodcast.next_episode_pub_date
      : undefined;

    response.morePages = (
      lnPodcast.next_episode_pub_date !== null && lnPodcast.episodes.lenght === 10
    );

    return res.status(200).json(response);
  },
};
