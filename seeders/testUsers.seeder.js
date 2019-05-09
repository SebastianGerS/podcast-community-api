/* eslint-disable class-methods-use-this, global-require */
import { Seeder } from 'mongoose-data-seed';
import uuidv4 from 'uuid/v4';
import { createUser, findOneUser } from '../dist/lib/User';
import { createMetaUser } from '../dist/lib/MetaUser';
import { createSession } from '../dist/lib/Session';

if (!process.env.PORT) {
  require('dotenv').config();
}

const metaUserIds = [
  uuidv4(), uuidv4(), uuidv4(),
];

const userData = [{
  _id: uuidv4(),
  username: 'test',
  email: 'test@test.test',
  password: 'password',
  type: 'public',
  metaUser: metaUserIds[0],
},
{
  _id: uuidv4(),
  username: 'public',
  email: 'public@test.test',
  password: 'password',
  type: 'public',
  metaUser: metaUserIds[1],
},
{
  _id: uuidv4(),
  username: 'private',
  email: 'private@test.test',
  password: 'password',
  type: 'private',
  metaUser: metaUserIds[2],
}];

const metaUserData = [{
  _id: metaUserIds[0],
  user: userData[0]._id,
},
{
  _id: metaUserIds[1],
  user: userData[1]._id,
},
{
  _id: metaUserIds[2],
  user: userData[2]._id,
}];

const sessionData = [{
  user: userData[0]._id,
  online: false,
},
{
  user: userData[1]._id,
  online: false,
},
{
  user: userData[2]._id,
  online: false,
}];

class InitialSeeder extends Seeder {
  async createUsers() {
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
    const user = await findOneUser({ email: userData[0].email }).catch(error => error);

    return !!user.errmsg;
  }

  async run() {
    const users = await this.createUsers().catch(error => error);

    return users.errmsg || users.errors ? false : [1, 1, 1];
  }
}

export default InitialSeeder;
