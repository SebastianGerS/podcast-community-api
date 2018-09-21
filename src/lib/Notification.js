import R from 'ramda';
import Notification from '../Models/Notification';

import {
  create,
} from '../Helpers/db';
/* eslint-disable import/prefer-default-export */
export const createNotification = R.partial(create, [Notification]);
