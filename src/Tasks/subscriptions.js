import { UTCStringToTime, getSecondsFromTimeString, getMillisecondsleft } from '../Helpers/general';
import { findSubscriptions } from '../lib/Subscriptions';
import { fetchAndEmitToSubscribers } from '../Helpers/fetch';

export async function fetchNewEpisodes(io) {
  const date = new Date();
  const oneDay = 1000 * 60 * 60 * 24;

  const subscriptions = await findSubscriptions(
    { query: { updated_at: { $lte: new Date(date - oneDay) } } },
  ).catch(error => error);

  if (!subscriptions.errmsg) {
    subscriptions.map((subscription) => {
      fetchAndEmitToSubscribers(io, subscription._id);
      return subscription;
    });
  }
}

export async function handleCheckForNewEpisodes(io) {
  const date = new Date();
  const oneDay = 1000 * 60 * 60 * 24;

  const subscriptionsNotUpdatedLastDay = await findSubscriptions(
    { query: { updated_at: { $lte: new Date(date - oneDay) } } },
  ).catch(error => error);

  if (!subscriptionsNotUpdatedLastDay.errmsg) {
    fetchNewEpisodes(io);
  }

  const time = UTCStringToTime(date.toUTCString());

  const currentTime = getSecondsFromTimeString(time) * 1000;
  const timeToFetch = 1000 * 60 * 60 * 12;

  const timeLeft = getMillisecondsleft(currentTime, timeToFetch);

  setTimeout(() => {
    fetchNewEpisodes(io);
    setInterval(() => {
      fetchNewEpisodes(io);
    }, oneDay);
  }, timeLeft);
}
