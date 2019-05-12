import { findNotifications, deleteNotification, updateNotification } from '../lib/Notification';
import { findUserById, handleUserUpdate } from '../lib/User';
import { formatNotifications } from '../Helpers/fetch';

export default {
  async findAllOnUser(req, res) {
    const { offset } = req.query;

    const user = await findUserById(req.userId);

    const query = { _id: { $in: user.notifications } };
    const skip = +offset;
    const limit = 10;
    const sort = { date: -1 };

    const notificationsPart = user.notifications.length > 0
      ? await findNotifications({
        query, skip, limit, sort,
      }).catch(error => error)
      : [];

    if (notificationsPart.errmsg) return res.status(404).json({ error: notificationsPart });

    const notificationsFull = user.notifications.length > 0
      ? await findNotifications({ query }).catch(error => error)
      : [];

    if (notificationsFull.errmsg) return res.status(404).json({ error: notificationsFull });

    const total = notificationsFull.length;

    const count = notificationsPart.length;

    const morePages = total - skip !== count;

    const formatedNotifications = user.notifications.length > 0
      ? await formatNotifications(notificationsPart)
      : [];

    const numberOfUnobserved = notificationsFull.reduce(
      (unobservedCount, notification) => (
        notification.observed === false ? unobservedCount + 1 : unobservedCount
      ),
      0,
    );

    const response = {
      morePages,
      next_offset: skip + limit,
      count,
      results: formatedNotifications,
      total,
      numberOfUnobserved,
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
      response.error = { errmsg: 'You are not authorized to delete this notification' };
    }

    return res.status(status).json(response);
  },
  async update(req, res) {
    const response = {};
    let status;
    const { notificationId } = req.params;

    const user = await findUserById(req.userId).catch(error => error);

    if (user.errmsg) return res.status(404).json({ error: user });

    if (user.notifications.map(notification => notification.toString()).includes(notificationId)) {
      const input = { observed: true };
      const notification = await updateNotification(notificationId, input).catch(error => error);

      if (notification.errmsg) return res.status(404).json({ error: notification });
      status = 200;
      response.notificationId = notificationId;
    } else {
      status = 401;
      response.error = { errmsg: 'You are not authorized to update this notification' };
    }
    return res.status(status).json(response);
  },
};
