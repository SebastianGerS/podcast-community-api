/* eslint-disable global-require */
import C from '../Controllers';
import verifyToken from '../Middleware/verifyToken';
import { upload } from '../Middleware/upload';

if (!process.env.PORT) {
  require('dotenv').config();
}

export default (app, io) => {
  app.get('/', (req, res) => res.redirect(process.env.DOCUMENTATION_URL));
  app.get('/me', verifyToken, C.UserController.me);
  app.post('/users', C.UserController.create);
  app.post('/admin/users', verifyToken, C.UserController.create);
  app.get('/users/:userId', C.UserController.find);
  app.put('/users', [verifyToken, (req, res, next) => upload('profileImg', req, res, next)], C.UserController.update);
  app.put('/admin/users/:userId', verifyToken, C.UserController.update);
  app.delete('/users', verifyToken, C.UserController.delete);
  app.delete('/admin/users/:userId', verifyToken, C.UserController.delete);
  app.post('/login', C.UserController.auth);
  app.get('/follows', verifyToken, C.UserController.follows);
  app.get('/search', C.SearchController.find);
  app.get('/filters', C.SearchController.getFilters);
  app.get('/audio/:audioUrl', C.AudioController.stream);
  app.post('/events', verifyToken, (req, res) => C.EventController.create(req, res, io));
  app.get('/events', verifyToken, C.EventController.followingEvents);
  app.get('/users/:userId/subscriptions', verifyToken, C.PodcastController.find);
  app.get('/podcasts/:podcastId', C.PodcastController.findOne);
  app.post('/podcasts/:podcastId/rating', verifyToken, (req, res) => C.RatingController.create(req, res, io));
  app.get('/episodes/:episodeId', C.EpisodeController.findOne);
  app.post('/categories', verifyToken, C.CategoryController.create);
  app.get('/notifications', verifyToken, C.NotificationController.findAllOnUser);
  app.put('/notifications/:notificationId', verifyToken, C.NotificationController.update);
  app.delete('/notifications/:notificationId', verifyToken, C.NotificationController.delete);
  app.put('/categories/:categoryId', verifyToken, C.CategoryController.update);
  app.delete('/categories/:categoryId', verifyToken, C.CategoryController.delete);
  app.get('/toplist', C.PodcastController.getTopList);
};
