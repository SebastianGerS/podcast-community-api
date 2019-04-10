import R from 'ramda';
import MetaUser from '../Models/MetaUser';
import { handleUpdate, create } from '../Helpers/db';

export const createMetaUser = R.partial(create, [MetaUser]);

export const handleMetaUserUpdate = R.partial(handleUpdate, [MetaUser, ['ratings']]);
