import uuidv4 from 'uuid/v4';
import * as User from '../lib/User';
import { hashPassword } from '../Helpers/db';
import { createMetaUser } from '../lib/MetaUser';

export default {
  async create(req, res) {
    const { body } = req;
    const metaUserId = uuidv4();
    const {
      username, email, password, type,
    } = await User.verifytoken(body.token);
    if (type === 'admin' && !req.isAdmin) return res.status(403).json({ error: 'Forbidden', message: 'You are not Authorzied to create admin accounts' });
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

    const metaUser = await createMetaUser({
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

    return res.status(200).json({ user: User.filterFields(user) });
  },
  async auth(req, res) {
    const token = await User.auth(req.body).catch(error => error);

    if (token.errmsg) return res.status(500).json({ error: token });

    return res.status(200).json({ token });
  },
  async me(req, res) {
    const user = await User.findUserById(req.userId).catch(error => error);

    if (user.errmsg) return res.status(500).json({ error: user, message: 'Error occurred when trying to find the user' });

    return res.status(200).json({ user: User.filterFields(user) });
  },
  async update(req, res) {
    if (req.body.password) {
      const password = await User.verifytoken(req.body.password);
      req.body.password = await hashPassword(password);
    }

    if (req.params.userId && !req.isAdmin) return res.status(403).json({ error: 'Forbidden', message: 'You are not Authorzied to update this user' });
    if (req.body.type === 'admin' && !req.isAdmin) return res.status(403).json({ error: 'Forbidden', message: 'You are not Authorzied to update this users type to admin' });

    const userId = req.params.userId ? req.params.userId : req.userId;
    const response = await User.handleUserUpdate(userId, req.body).catch(error => error);

    if (response.errmsg) return res.status(500).json({ error: response });
    const modifyedFields = Object.keys(req.body).map((key, index, array) => {
      if (index === array.length - 1) {
        return `${key} `;
      }
      if (index === array.length - 2) {
        return `${key} and `;
      }
      return `${key}, `;
    }).reduce((accumulator, currentValue) => accumulator + currentValue);
    response.info = `${modifyedFields}was updated`;

    return res.status(200).json(response);
  },
  async delete(req, res) {
    if (req.params.userId && !req.isAdmin) return res.status(403).json({ error: 'Forbidden', message: 'You are not Authorzied to delete this user' });
    const userId = req.params.userId ? req.params.userId : req.userId;

    const user = await User.deleteUser({ _id: userId }).catch(error => error);

    if (user.errmsg) return res.status(500).json({ error: user, message: 'Error occurred when trying to delete the user' });

    return res.status(200).json({ info: 'User was deleted' });
  },
  async follows(req, res) {
    const response = await User.getUserWithPopulatedFollows(req.userId);

    if (response.errmsg) return res.status(500).json({ error: response, message: 'Error occurred when trying to fetch user follows' });

    return res.status(200).json(response);
  },
};
