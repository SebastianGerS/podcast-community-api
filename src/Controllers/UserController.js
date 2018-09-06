import * as User from '../lib/User';

export default {
  create(req, res) {
    User.create({
      res,
      body: req.body,
    });
  },
  find(req, res) {
    User.find({
      res,
      id: req.params.userId,
    });
  },
};
