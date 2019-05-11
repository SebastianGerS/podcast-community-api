/* eslint-disable global-require, no-console, no-unused-vars, prefer-arrow-callback */
import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import socketIo from 'socket.io';
import db from './db';
import routes from './Routes';
import { handleCheckForNewEpisodes } from './Tasks/subscriptions';
import { sockets } from './Helpers/socket';
import { resetUserSessions } from './Tasks/resetUserSessions';

if (!process.env.PORT) {
  require('dotenv').config();
}

const port = process.env.PORT || 1337;
const app = express();
const server = http.Server(app);
const io = socketIo(server);

const dir = path.join(__dirname, 'public/images');

app.use(express.static(dir));
app.use(cors(
  { origin: process.env.ALLOW_ORIGIN },
));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json());

sockets(io);

server.listen(port, () => {
  console.log(`express is now listening to port ${port}`);
  handleCheckForNewEpisodes(io);
  resetUserSessions().then((res) => {
    if (res.nModified > 0) {
      console.log('user sessions are now reset');
    } else if (res.ok === 1) {
      console.log('no user sessions needed to be reset');
    } else {
      console.log('error occured when trying to reset uesr sessions');
    }
  });
});

routes(app, io);
