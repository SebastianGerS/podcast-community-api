/* eslint-disable global-require */
import bcrypt from 'bcryptjs';
import JWT from 'jsonwebtoken';
import R from 'ramda';
import User from '../Models/User';
import * as Db from '../Helpers/db';

if (!process.env.JWT_SECRET) {
  require('dotenv').config();
}

export async function verifytoken(token) {
  const response = await new Promise(async (resolve, reject) => {
    JWT.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) reject(err);
      resolve(decoded);
    });
  });
  return response;
}
export function filterFields(user) {
  return {
    _id: user.id,
    username: user.username,
    email: user.email,
    age: user.age,
    bio: user.bio,
    type: user.type,
    profile_img: {
      thumb: user.profile_img.thumb,
      standard: user.profile_img.standard,
      large: user.profile_img.large,
    },
    following: user.following,
    followers: user.followers,
    requests: user.requests,
    listenlist: user.listenlist,
    subscriptions: user.subscriptions,
    notifications: user.notifications,
    events: user.events,
    restricted: user.restricted,

  };
}
export const createUser = R.partial(Db.create, [User]);

export const findUserById = R.partial(Db.findById, [User]);

export const findOneUser = R.partial(Db.findOne, [User]);

export const findUsers = R.partial(Db.find, [User, {
  _id: 1,
  username: 1,
  profile_img: 1,
  email: 1,
  type: 1,
  requests: 1,
  events: 1,
  subscriptions: 1,
  followers: 1,
  following: 1,
}]);

export const updateUser = R.partial(Db.update, [User]);

export const findAndUpdateUser = R.partial(Db.findAndUpdate, [User]);

export const handleUserUpdate = R.partial(
  Db.handleUpdate,
  [User, ['subscriptions', 'following', 'followers', 'restricted', 'listenlist', 'events', 'requests', 'notifications', 'categories']],
);

export const deleteUser = R.partial(Db.deleteOne, [User]);

export async function auth(data) {
  const response = await new Promise(async (resolve, reject) => {
    const { email, password } = await verifytoken(data.token).catch(error => error);

    const user = await findOneUser({ email }).catch(error => error);

    if (user.errmsg) reject(user);
    if (user.password) {
      if (!bcrypt.compareSync(password, user.password)) {
        const UnauthorizedError = new Error();
        UnauthorizedError.errmsg = 'Incorect password';
        reject(UnauthorizedError);
      } else {
        resolve(JWT.sign(
          { user: filterFields(user) },
          process.env.JWT_SECRET,
          { expiresIn: 3600 },
        ));
      }
    }
  });

  return response;
}
