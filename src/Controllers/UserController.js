import uuidv4 from 'uuid/v4';
import * as User from '../lib/User';

export default {
  async create(req, res) {
    const { body } = req;
    const metaUserId = uuidv4();
    const {
      username, email, password, type,
    } = await User.verifytoken(body.token);

    const user = await User.createUser({
      _id: uuidv4(),
      username,
      email,
      password,
      type,
      metaUser: metaUserId,
    }).catch(error => error);

    if (user.errmsg) {
      let message;
      if (user.errmsg.includes('username')) {
        message = 'Username is already in use';
      } else if (user.errmsg.includes('email')) {
        message = 'Email is already in registered';
      }

      return res.status(500).json({ error: user, message });
    }

    const metaUser = await User.createMetaUser({
      _id: metaUserId,
      user: user.id,
    }).catch(error => error);

    if (metaUser.errmsg) return res.status(500).json({ error: metaUser, message: 'Error creating the metaUser' });

    const token = await User.auth(req.body).catch(error => error);

    if (token.errmsg) return res.status(500).json({ error: token });

    return res.status(200).json({ token });
  },
  async find(req, res) {
    const user = await User.findUserById(req.params.userId).catch(error => error);

    if (user.errmsg) return res.status(500).json({ error: user, message: 'Error occurred when trying to find the user' });

    return res.status(200).json({ user });
  },
  async auth(req, res) {
    const token = await User.auth(req.body).catch(error => error);

    if (token.errmsg) return res.status(500).json({ error: token });

    return res.status(200).json({ token });
  },
};
