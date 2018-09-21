import R from 'ramda';
import Event from '../Models/Event';

import {
  create,
} from '../Helpers/db';
/* eslint-disable import/prefer-default-export */
export const createEvent = R.partial(create, [Event]);
