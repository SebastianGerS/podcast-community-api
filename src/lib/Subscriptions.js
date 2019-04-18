import R from 'ramda';
import Subscription from '../Models/Subscription';
import {
  findOrCreate, deleteOne, find, update, findById, create,
} from '../Helpers/db';

export const findOrCreateSubscription = R.partial(findOrCreate, [Subscription]);
export const deleteSubscription = R.partial(deleteOne, [Subscription]);
export const findSubscriptions = R.partial(find, [Subscription, { _id: 1, updated_at: 1 }]);
export const updateSubscription = R.partial(update, [Subscription]);
export const findSubscriptionById = R.partial(findById, [Subscription]);
export const createSubscription = R.partial(create, [Subscription]);
