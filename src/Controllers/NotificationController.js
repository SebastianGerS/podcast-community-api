import { findNotifications } from '../lib/Notification';
import { findUserById } from '../lib/User';

export default {
  async findAllOnUser(req, res) {
    const { offset } = req.query;

    const user = await findUserById(req.userId);

    const query = { _id: { $in: user.notifications } };
    const skip = +offset;
    const limit = 10;

    const notificationsPart = await findNotifications({ query, skip, limit }, [{ path: 'event', populate: { path: 'agent.item', select: ['profile_img.thumb', 'username', '_id'] } }]).catch(error => error);

    if (notificationsPart.errmsg) return res.status(404).json({ error: notificationsPart });

    const notificationsFull = await findNotifications({ query }).catch(error => error);

    if (notificationsFull.errmsg) return res.status(404).json({ error: notificationsFull });

    const total = notificationsFull.length;

    const count = notificationsPart.length;

    const morePages = total - skip !== count;

    const response = {
      morePages,
      next_offset: skip + limit,
      count,
      results: notificationsPart,
      total,
    };

    return res.status(200).json(response);
  },
};
