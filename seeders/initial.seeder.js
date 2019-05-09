/* eslint-disable class-methods-use-this, global-require */
import { Seeder } from 'mongoose-data-seed';
import uuidv4 from 'uuid/v4';
import { createUser, findOneUser, updateUser } from '../dist/lib/User';
import { createMetaUser } from '../dist/lib/MetaUser';
import { createSession } from '../dist/lib/Session';

if (!process.env.PORT) {
  require('dotenv').config();
}

const metaUserId = uuidv4();
const userId = uuidv4();

const userData = {
  _id: userId,
  username: 'SebastianGS',
  email: 'sebastiangerstelsollerman@hotmail.com',
  password: process.env.ADMIN_PASSWORD,
  type: 'admin',
  metaUser: metaUserId,
};

const metaUserData = {
  _id: metaUserId,
  user: userId,
};

const sessionData = {
  user: userId,
  online: false,
};

class InitialSeeder extends Seeder {
  async createAdmin() {
    return new Promise(async (resolve, reject) => {
      const user = await createUser(userData).catch(error => error);

      if (user.errmsg || user.errors) reject(user);

      const metaUser = await createMetaUser(metaUserData).catch(error => error);

      if (metaUser.errmsg || metaUser.errors) reject(metaUser);

      const session = await createSession(sessionData).catch(error => error);

      if (session.errmsg || session.errors) reject(session);

      resolve(true);
    });
  }

  async shouldRun() {
    const user = await findOneUser({ email: userData.email }).catch(error => error);
    if (!user.errmsg) {
      await updateUser(user._id, { type: 'admin' }).catch(error => error);
    }
    return !!user.errmsg;
  }

  async run() {
    const admin = await this.createAdmin().catch(error => error);

    return admin.errmsg || admin.errors ? false : [1];
  }
}

export default InitialSeeder;
