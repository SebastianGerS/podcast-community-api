
import * as Event from '../lib/Event';
import { createNotification } from '../lib/Notification';
import { handleUserUpdate, findUserById } from '../lib/User';
import { handleCategoryUpdate, findCategoryById } from '../lib/Category';

export default {
  async create(req, res) {
    req.body.agent = { kind: 'User', item: req.userId };
    const {
      agent, target, object, type,
    } = req.body;

    const body = {};
    const eventBody = { agent, target, object };
    const response = {};

    if (target.kind === 'Podcast') {
      const user = await findUserById(req.userId);
      eventBody.type = user.subscriptions.includes(target.item) ? 'unsubscribe' : 'subscribe';
      if (eventBody.type === 'unsubscribe') {
        await Promise.all(user.categories.map(async (categoryId) => {
          const category = await findCategoryById(categoryId).catch(error => error);
          if (category.errmsg) return res.status(500).json({ error: category, message: 'Error finding category' });
          if (category.podcasts.includes(target.item)) {
            const categoryWithMatch = await handleCategoryUpdate(
              category._id,
              { podcasts: target.item },
            ).catch(error => error);
            if (categoryWithMatch.errmsg) return res.status(500).json({ error: categoryWithMatch, message: 'Error removing podcast from category' });
          }
          return category;
        }));
      }
      response.event = await Event.createEvent(eventBody);

      if (response.event.errmsg) return res.status(500).json({ error: response.event, message: 'Error creating the event' });

      body.events = response.event._id;
      body.subscriptions = target.item;
    }
    if (target.kind === 'Episode') {
      const user = await findUserById(req.userId);

      eventBody.type = user.listenlist.includes(target.item) ? 'remove' : 'add';

      response.event = await Event.createEvent(eventBody);

      if (response.event.errmsg) return res.status(500).json({ error: response.event, message: 'Error creating the event' });

      body.events = response.event._id;
      body.listenlist = target.item;
    }
    if (target.kind === 'User') {
      if (type === 'follows') {
        const user = await findUserById(req.userId);
        const targetUser = await findUserById(target.item);

        let eventType;

        if (user.following.includes(target.item)) {
          eventType = 'unfollow';
        } else if (targetUser.type === 'public') {
          eventType = 'follow';
        } else if (targetUser.requests.includes(req.userId)) {
          eventType = 'unrequest';
        } else {
          eventType = 'request';
        }

        eventBody.type = eventType;
      } else if (type === 'restriction') {
        const user = await findUserById(req.userId);

        eventBody.type = user.restricted.includes(target.item) ? 'unblock' : 'block';
      } else {
        eventBody.type = type;
      }
      response.event = await Event.createEvent(eventBody);

      if (response.event.errmsg) return res.status(500).json({ error: response.event, message: 'Error creating the event' });

      const notificationBody = { user: target.item, event: response.event._id };
      const notification = await createNotification(notificationBody);

      if (notification.errmsg) return res.status(500).json({ error: notification, message: 'Error creating the notification' });

      if (response.event.type === 'follow' || response.event.type === 'unfollow') {
        body.events = response.event._id;
        body.following = target.item;

        const targetBody = {
          followers: agent.item,
          notifications: notification._id,
          event: response.event._id,
        };

        const updateTargetUser = await handleUserUpdate(target.item, targetBody);

        if (updateTargetUser.errmsg) return res.status(500).json({ error: updateTargetUser, message: 'Error creating the notification' });
      } else if (response.event.type === 'request' || response.event.type === 'unrequest') {
        const targetBody = {
          notifications: notification._id,
          requests: agent.item,
          event: response.event._id,
        };

        const updateTargetUser = await handleUserUpdate(target.item, targetBody);

        if (updateTargetUser.errmsg) return res.status(500).json({ error: updateTargetUser, message: 'Error creating the notification' });
      } else if (response.event.type === 'confirm') {
        body.events = response.event._id;
        body.followers = target.item;
        body.requests = target.item;

        const targetBody = {
          notifications: notification._id,
          following: agent.item,
          event: response.event._id,
        };

        const updateTargetUser = await handleUserUpdate(target.item, targetBody);

        if (updateTargetUser.errmsg) return res.status(500).json({ error: updateTargetUser, message: 'Error creating the notification' });
      } else if (response.event.type === 'reject') {
        body.events = response.event._id;
        body.requests = target.item;
      } else if (response.event.type === 'block' || response.event.type === 'unblock') {
        body.events = response.event._id;
        body.restricted = target.item;
      } else if (response.event.type === 'recommend') {
        const targetBody = { notifications: notification._id, event: response.event._id };

        const updateTargetUser = await handleUserUpdate(target.item, targetBody);
        body.events = response.event._id;
        if (updateTargetUser.errmsg) return res.status(500).json({ error: updateTargetUser, message: 'Error creating the notification' });
      }
    }
    const updateUser = await handleUserUpdate(req.userId, body);

    if (updateUser.errmsg) return res.status(500).json({ error: updateUser, message: 'Error updating the user' });

    return res.status(200).json(response);
  },
};
