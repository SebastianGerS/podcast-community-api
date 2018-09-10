
import C from '../Controllers';

export default (app) => {
  app.get('/', (req, res) => res.send('hello world'));
  app.post('/users', C.UserController.create);
  app.get('/users/:userId', C.UserController.find);
  app.post('/login', C.UserController.auth);
  app.get('/search', C.SearchController.find);
};
