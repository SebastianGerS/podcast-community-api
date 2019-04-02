import { findNotifications, deleteNotification } from '../lib/Notification';
import { findUserById, handleUserUpdate } from '../lib/User';

export default {
  async findAllOnUser(req, res) {
    const { offset } = req.query;

    const user = await findUserById(req.userId);

    const query = { _id: { $in: user.notifications } };
    const skip = +offset;
    const limit = 10;
    const sorting = '-event.date';

    const notificationsPart = await findNotifications({
      query, skip, limit, sorting,
    }, [{ path: 'event', populate: { path: 'agent.item', select: ['profile_img.thumb', 'username', '_id'] } }]).catch(error => error);

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
  async delete(req, res) {
    const response = {};
    let status;

    const { notificationId } = req.params;

    const user = await findUserById(req.userId).catch(error => error);

    if (user.errmsg) return res.status(404).json({ error: user });

    if (user.notifications.map(notification => notification.toString()).includes(notificationId)) {
      try {
        await handleUserUpdate(req.userId, { notifications: notificationId });

        const query = { _id: notificationId };
        await deleteNotification(query).catch(error => error);

        response.info = 'notification successfully deleted';
        status = 200;
      } catch (error) {
        return res.status(404).json({ error });
      }
    } else {
      status = 401;
      response.info = 'You are not authorized to delete this notification';
    }

    return res.status(status).json(response);
  },
};
