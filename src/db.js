/* eslint-disable global-require, no-console */

import mongoose from 'mongoose';

if (!process.env.PORT) {
  require('dotenv').config();
}

const db = process.env.DB;
const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const dbConnectionString = `mongodb://${username}:${password}@${db}`;

mongoose.connect(dbConnectionString, { useNewUrlParser: true });

mongoose.connection.on('error', (error) => {
  setTimeout(() => {
    mongoose.connect(`${db}`, { useNewUrlParser: true });
  }, 1000);
  console.log(`error connecting to the database: ${error}`);
});

mongoose.connection.once('open', () => {
  console.log(`successfully connected to the database: ${db}`);
});
