
import C from '../Controllers';
import verifyToken from '../Middleware/verifyToken';

export default (app) => {
  app.get('/', (req, res) => res.redirect('https://documenter.getpostman.com/view/3252976/RWgnWzKb#intro'));
  app.get('/me', verifyToken, C.UserController.me);
  app.post('/users', C.UserController.create);
  app.post('/admin/users', verifyToken, C.UserController.create);
  app.get('/users/:userId', C.UserController.find);
  app.put('/users', verifyToken, C.UserController.update);
  app.put('/admin/users/:userId', verifyToken, C.UserController.update);
  app.delete('/users', verifyToken, C.UserController.delete);
  app.delete('/admin/users/:userId', verifyToken, C.UserController.delete);
  app.post('/login', C.UserController.auth);
  app.get('/search', C.SearchController.find);
  app.get('/filters', C.SearchController.getFilters);
  app.get('/audio/:audioUrl', C.AudioController.stream);
  app.post('/events', verifyToken, C.EventController.create);
  app.get('/users/:userId/subscriptions', verifyToken, C.PodcastController.find);
  app.get('/podcasts/:podcastId', C.PodcastController.findOne);
  app.get('/episodes/:episodeId', C.EpisodeController.findOne);
  app.post('/categories', verifyToken, C.CategoryController.create);
  app.put('/categories/:categoryId', verifyToken, C.CategoryController.update);
  app.delete('/categories/:categoryId', verifyToken, C.CategoryController.delete);
  app.get('/toplist', C.PodcastController.getTopList);
};
