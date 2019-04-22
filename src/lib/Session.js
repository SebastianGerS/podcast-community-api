import R from 'ramda';
import Session from '../Models/Session';
import {
  findOrCreate, findAndUpdate, create, findOne, find,
} from '../Helpers/db';
import { fetchEpisodesListenNotes } from '../Helpers/fetch';
import { reduceToString } from '../Helpers/general';

export const findOneSession = R.partial(findOne, [Session]);
export const findSessions = R.partial(find, [Session,
  {
    _id: 1, user: 1, listening_to: 1, online: 1, updated_at: 1,
  }]);
export const findOrCreateSession = R.partial(findOrCreate, [Session]);
export const findAndUpdateSession = R.partial(findAndUpdate, [Session]);

export const createSession = R.partial(create, [Session]);

function mergeSessionsWithListenNotesData(sessions, fetchedEpisodes) {
  return sessions.map((session) => {
    const sessionCopy = JSON.parse(JSON.stringify(session));

    fetchedEpisodes.map((episode) => {
      if (session.listening_to === episode.id) {
        sessionCopy.listening_to = {
          id: episode.id,
          title: episode.title,
          podcast_title: episode.podcast_title,
          audio: episode.audio,
        };
      }

      return episode;
    });

    return sessionCopy;
  });
}

export async function formatSessions(sessions) {
  let formatedSessions;
  const ids = sessions.filter(session => session.listening_to !== null)
    .map(session => session.listening_to);
  if (ids.length !== 0) {
    const stringyfiedIds = reduceToString(ids, ',');
    const fetchedEpisodes = await fetchEpisodesListenNotes(`ids=${stringyfiedIds}`).catch(error => error);

    formatedSessions = mergeSessionsWithListenNotesData(sessions, fetchedEpisodes);
  }

  return formatedSessions || sessions;
}
