import uuidv4 from 'uuid/v4';
import * as User from '../lib/User';

export default {
  async create(req, res) {
    const { body } = req;
    const metaUserId = uuidv4();

    const user = await User.createUser({
      _id: uuidv4(),
      username: body.username,
      email: body.email,
      password: body.password,
      type: body.type,
      metaUser: metaUserId,
    }).catch(error => error);

    if (user.errmsg) return res.status(500).json({ error: user, message: 'error creating the user' });

    const metaUser = await User.createMetaUser({
      _id: metaUserId,
      user: user.id,
    }).catch(error => error);

    if (metaUser.errmsg) return res.status(500).json({ error: metaUser, message: 'error creating the metaUser' });

    return res.status(200).json({ user });
  },
  async find(req, res) {
    const user = await User.findUserById(req.params.userId).catch(error => error);

    if (user.errmsg) return res.status(500).json({ error: user, message: 'error occurred when trying to find the user' });

    return res.status(200).json({ user });
  },
  async auth(req, res) {
    const token = await User.auth({
      email: req.body.email,
      password: req.body.password,
    }).catch(error => error);

    if (token.errmsg) return res.status(500).json({ error: token });

    return res.status(200).json({ token });
  },
};
