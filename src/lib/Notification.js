import R from 'ramda';
import Notification from '../Models/Notification';

import {
  create,
  find,
} from '../Helpers/db';
/* eslint-disable import/prefer-default-export */
export const createNotification = R.partial(create, [Notification]);
export const findNotifications = R.partial(find, [Notification, {
  _id: 1, user: 1, event: 1, observed: 1,
}]);
