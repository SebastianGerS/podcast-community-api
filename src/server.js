/* eslint-disable global-require, no-console, no-unused-vars */
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import db from './db';
import routes from './Routes';

if (!process.env.PORT) {
  require('dotenv').config();
}

const port = process.env.PORT || 1337;
const app = express();

const dir = path.join(__dirname, 'public/images');

app.use(express.static(dir));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.listen(port, () => console.log(`express is now listening to port ${port}`));

routes(app);
