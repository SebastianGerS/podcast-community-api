
import UserController from '../Controllers/UserController';

export default (app) => {
  app.get('/', (req, res) => res.send('hello world'));
  app.post('/users', UserController.create);
  app.get('/users/:userId', UserController.find);
};
