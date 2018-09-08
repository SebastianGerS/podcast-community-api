/* eslint-disable global-require */
import bcrypt from 'bcryptjs';
import JWT from 'jsonwebtoken';
import R from 'ramda';
import User from '../Models/User';
import MetaUser from '../Models/MetaUser';
import { create, findById, findOne } from '../Helpers/db';

if (!process.env.JWT_SECRET) {
  require('dotenv').config();
}

export const createUser = R.partial(create, [User]);

export const createMetaUser = R.partial(create, [MetaUser]);

export const findUserById = R.partial(findById, [User]);

export const findOneUser = R.partial(findOne, [User]);

export async function auth(data) {
  const response = await new Promise(async (resolve, reject) => {
    const { email, password } = data;

    const user = await findOneUser({ email }).catch(error => error);

    if (user.errmsg) reject(user);

    if (user.password) {
      if (!bcrypt.compareSync(password, user.password)) {
        const UnauthorizedError = new Error();
        UnauthorizedError.errmsg = 'credentials does not match';
        reject(UnauthorizedError);
      } else {
        resolve(JWT.sign({ user }, process.env.JWT_SECRET, { expiresIn: 3600 }));
      }
    }
  });

  return response;
}
