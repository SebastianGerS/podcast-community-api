/* eslint-disable global-require */
import mongooseLib from 'mongoose';
import initialSeeder from './seeders/initial.seeder';

if (!process.env.PORT) {
  require('dotenv').config();
}

mongooseLib.Promise = global.Promise;

// Export the mongoose lib
export const mongoose = mongooseLib;

// Export the mongodb url
const db = process.env.DB;
const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;

export const mongoURL = `mongodb://${username}:${password}@${db}`;

/*
  Seeders List
  ------
  order is important
*/
export const seedersList = {
  initialSeeder,
};
