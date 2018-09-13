/* eslint-disable global-require */
import bcrypt from 'bcryptjs';
import JWT from 'jsonwebtoken';
import R from 'ramda';
import User from '../Models/User';
import MetaUser from '../Models/MetaUser';
import {
  create, findById, findOne, find,
} from '../Helpers/db';

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
function excludeFields(user) {
  return {
    _id: user.id,
    username: user.username,
    email: user.email,
    age: user.age,
    bio: user.bio,
    type: user.type,
    profile_img: {
      thumb: user.thumb,
      standard: user.standard,
      large: user.large,
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
export const createUser = R.partial(create, [User]);

export const createMetaUser = R.partial(create, [MetaUser]);

export const findUserById = R.partial(findById, [User]);

export const findOneUser = R.partial(findOne, [User]);

export const findUsers = R.partial(find, [User, { _id: 1, username: 1, profile_img: 1 }]);

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
          { user: excludeFields(user) },
          process.env.JWT_SECRET,
          { expiresIn: 3600 },
        ));
      }
    }
  });

  return response;
}
