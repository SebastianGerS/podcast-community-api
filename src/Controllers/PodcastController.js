import { findUserById } from '../lib/User';
import { findCategoryById } from '../lib/Category';
import { fetchPodcastListenNotes, getTopPodcasts } from '../Helpers/fetch';
import { findOrCreatePodcast } from '../lib/Podcast';
import { findEpisodes } from '../lib/Episode';

export default {
  async find(req, res) {
    const user = await findUserById(req.params.userId).catch(error => error);

    if (user.errmsg) return res.status(404).json({ error: user });
    const subscriptions = [];
    const categories = [];
    await Promise.all(user.subscriptions.map(async (subscription) => {
      const podcast = await fetchPodcastListenNotes(subscription);

      if (podcast.errmsg) return res.status(podcast.status).json({ error: podcast });

      subscriptions.push(podcast);

      return podcast;
    }));

    await Promise.all(user.categories.map(async (categoryId) => {
      const category = await findCategoryById(categoryId);

      if (category.error) return res.status(404).json({ error: category });

      categories.push(category);

      return category;
    }));


    const categoriesWithPodcasts = categories.map((category) => {
      const categoryWithPodcasts = {};
      categoryWithPodcasts.name = category.name;
      categoryWithPodcasts._id = category._id;
      const includedIds = subscriptions.map(
        podcast => podcast.id,
      ).filter(id => category.podcasts.includes(id));

      const podcasts = subscriptions.filter(subscription => includedIds.includes(subscription.id));
      if (podcasts) {
        categoryWithPodcasts.podcasts = podcasts;
      } else {
        categoryWithPodcasts.podcasts = [];
      }

      return categoryWithPodcasts;
    });

    return res.status(200).json({ subscriptions, categories: categoriesWithPodcasts });
  },
  async getTopList(req, res) {
    const response = await getTopPodcasts().catch(error => error);
    if (response.errmsg) return res.status(response.status).json({ error: response });
    return res.status(200).json(response.channels);
  },
  async findOne(req, res) {
    const { podcastId } = req.params;

    const response = {};

    const lnPodcast = await fetchPodcastListenNotes(podcastId);

    if (lnPodcast.errmsg) return res.status(lnPodcast.status).json({ error: lnPodcast });

    response.podcast = lnPodcast;

    const podcast = await findOrCreatePodcast({ _id: podcastId }).catch(error => error);
    console.log(podcast);
    if (podcast.errmsg) return res.status(podcast.status).json({ error: podcast });

    const query = { query: { podcast: podcastId } };

    const episodes = await findEpisodes(query).catch(error => error);

    const episodeRatings = Array.isArray(episodes)
      ? episodes.map(episode => (
        { episodeId: episode.id, rating: episode.avrageRating }
      ))
      : [];

    response.ratings = { avrageRating: podcast.avrageRating, episodeRatings };

    return res.status(200).json(response);
  },
};
