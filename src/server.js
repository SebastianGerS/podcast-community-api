/* eslint-disable global-require, no-console, no-unused-vars */
import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import sockets from 'socket.io';
import db from './db';
import routes from './Routes';

if (!process.env.PORT) {
  require('dotenv').config();
}

const port = process.env.PORT || 1337;
const app = express();
const server = http.Server(app);
const io = sockets(server);

const dir = path.join(__dirname, 'public/images');

app.use(express.static(dir));
app.use(cors(
  { origin: process.env.ALLOW_ORIGIN },
));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

server.listen(port, () => console.log(`express is now listening to port ${port}`));

io.on('connection', (socket) => {
  console.log('client is now connected');

  socket.on('disconnect', () => {
    console.log('client is now disconected');
  });
});

routes(app, io);
