import { findUserById } from '../lib/User';
import { findCategoryById } from '../lib/Category';
import { fetchPodcastListenNotes, getTopPodcasts } from '../Helpers/fetch';

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
    const response = await fetchPodcastListenNotes(req.params.podcastId);

    if (response.errmsg) return res.status(response.status).json({ error: response });

    return res.status(200).json(response);
  },
};