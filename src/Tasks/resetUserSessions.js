import { updateSessions } from '../lib/Session';

export async function resetUserSessions() {
  const sessions = await updateSessions(
    { online: true }, { online: false, listeningTo: undefined },
  ).catch(error => error);

  return sessions;
}
