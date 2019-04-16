import {
  findEvents, createEvent, formatPopulatedEvent,
  formatPopulatedUser, handleSubscribe, handleUnsubscribe,
} from '../lib/Event';
import { createNotification } from '../lib/Notification';
import { handleUserUpdate, findUserById, findUsers } from '../lib/User';
import { handleCategoryUpdate, findCategoryById } from '../lib/Category';
import { formatEvents } from '../Helpers/fetch';

export default {
  async create(req, res, io) {
    req.body.agent = { kind: 'User', item: req.userId };
    const {
      agent, target, object, type,
    } = req.body;

    const body = {};
    const eventBody = {
      agent,
      target: { item: target._id, kind: target.kind },
      object: { item: object._id, kind: object.kind },
    };
    const response = {};
    const notificationTypes = ['request', 'follow', 'confirm', 'recommend'];
    const eventEmitionTypes = ['confirm', 'follow', 'recommend', 'subscribe'];
    let notificationId;

    const user = await findUserById(req.userId);

    if (user.errmsg) return res.status(404).json({ error: user });

    if (target.kind === 'Podcast') {
      eventBody.type = user.subscriptions.includes(target._id) ? 'unsubscribe' : 'subscribe';

      if (eventBody.type === 'unsubscribe') {
        await Promise.all(user.categories.map(async (categoryId) => {
          const category = await findCategoryById(categoryId).catch(error => error);
          if (category.errmsg) return res.status(500).json({ error: category, message: 'Error finding category' });
          if (category.podcasts.includes(target._id)) {
            const categoryWithMatch = await handleCategoryUpdate(
              category._id,
              { podcasts: target._id },
            ).catch(error => error);
            if (categoryWithMatch.errmsg) return res.status(500).json({ error: categoryWithMatch, message: 'Error removing podcast from category' });
          }
          return category;
        }));
        handleUnsubscribe(target._id, req.userId);
      } else {
        handleSubscribe(target._id, req.userId, io);
      }
      response.event = await createEvent(eventBody);

      if (response.event.errmsg) return res.status(500).json({ error: response.event, message: 'Error creating the event' });

      body.events = response.event._id;
      body.subscriptions = target._id;
    }
    if (target.kind === 'Episode') {
      eventBody.type = user.listenlist.includes(target._id) ? 'remove' : 'add';

      response.event = await createEvent(eventBody);

      if (response.event.errmsg) return res.status(500).json({ error: response.event, message: 'Error creating the event' });

      body.events = response.event._id;
      body.listenlist = target._id;
    }
    if (target.kind === 'User') {
      if (type === 'follows') {
        const targetUser = await findUserById(target._id);

        let eventType;

        if (user.following.includes(target._id)) {
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
        eventBody.type = user.restricted.includes(target._id) ? 'unblock' : 'block';
      } else {
        eventBody.type = type;
      }
      response.event = await createEvent(eventBody);

      if (response.event.errmsg) return res.status(500).json({ error: response.event, message: 'Error creating the event' });

      if (notificationTypes.includes(eventBody.type)) {
        const notificationBody = { user: target._id, event: response.event._id };
        const notification = await createNotification(notificationBody);

        if (notification.errmsg) return res.status(500).json({ error: notification, message: 'Error creating the notification' });

        notificationId = notification._id;
        const notificationCopy = JSON.parse(JSON.stringify(notification));

        notificationCopy.event = formatPopulatedEvent(notification.event, object);

        io.emit(`user/${notification.user}/notification`, notificationCopy);
      }

      if (response.event.type === 'follow' || response.event.type === 'unfollow') {
        body.events = response.event._id;
        body.following = target._id;

        const targetBody = {
          followers: agent.item,
          events: response.event._id,
        };

        if (notificationId) {
          targetBody.notifications = notificationId;
        }

        const updateTargetUser = await handleUserUpdate(target._id, targetBody);

        if (updateTargetUser.errmsg) return res.status(500).json({ error: updateTargetUser, message: 'Error creating the notification' });
      } else if (response.event.type === 'request' || response.event.type === 'unrequest') {
        const targetBody = {
          requests: agent.item,
          events: response.event._id,
        };

        if (notificationId) {
          targetBody.notifications = notificationId;
        }

        const updateTargetUser = await handleUserUpdate(target._id, targetBody);

        if (updateTargetUser.errmsg) return res.status(500).json({ error: updateTargetUser, message: 'Error creating the notification' });
      } else if (response.event.type === 'confirm') {
        body.events = response.event._id;
        body.followers = target._id;
        body.requests = target._id;

        const targetBody = {
          following: agent.item,
          events: response.event._id,
        };

        if (notificationId) {
          targetBody.notifications = notificationId;
        }

        const updateTargetUser = await handleUserUpdate(target._id, targetBody);

        if (updateTargetUser.errmsg) return res.status(500).json({ error: updateTargetUser, message: 'Error creating the notification' });
      } else if (response.event.type === 'reject') {
        body.events = response.event._id;
        body.requests = target._id;
      } else if (response.event.type === 'block' || response.event.type === 'unblock') {
        body.events = response.event._id;
        body.restricted = target._id;
      } else if (response.event.type === 'remove') {
        body.events = response.event._id;
        body.followers = target._id;

        const targetBody = {
          following: agent.item,
          events: response.event._id,
        };

        const updateTargetUser = await handleUserUpdate(target._id, targetBody);

        if (updateTargetUser.errmsg) return res.status(500).json({ error: updateTargetUser, message: 'Error creating the notification' });
      } else if (response.event.type === 'recommend') {
        const targetBody = { events: response.event._id };

        if (notificationId) {
          targetBody.notifications = notificationId;
        }

        const updateTargetUser = await handleUserUpdate(target._id, targetBody);
        body.events = response.event._id;
        if (updateTargetUser.errmsg) return res.status(500).json({ error: updateTargetUser, message: 'Error creating the notification' });
      }
    }
    const updateUser = await handleUserUpdate(req.userId, body);

    if (updateUser.errmsg) return res.status(500).json({ error: updateUser, message: 'Error updating the user' });

    if (eventEmitionTypes.includes(response.event.type)) {
      let eventCopy = JSON.parse(JSON.stringify(response.event));

      if (eventCopy.target.kind === 'Podcast') {
        eventCopy.target = target;
        eventCopy.agent = formatPopulatedUser(eventCopy.agent);
      } else {
        eventCopy = formatPopulatedEvent(eventCopy, object);
      }

      user.followers.map((follower) => {
        if (follower !== eventCopy.target._id) {
          io.emit(`users/${follower}/event`, eventCopy);
        }
        return follower;
      });
    }

    return res.status(200).json(response);
  },
  async followingEvents(req, res) {
    const { userId } = req;
    const { offset } = req.query;

    const response = {};

    const user = await findUserById(userId).catch(error => error);

    if (user.errmsg) return res.status(404).json({ error: user });

    const followingUsers = await findUsers({ _id: { $in: user.following } }).catch(error => error);

    const eventIds = [];

    if (Array.isArray(followingUsers)) {
      followingUsers.map((followedUser) => {
        followedUser.events.map((event) => {
          if (!eventIds.includes(event)) {
            eventIds.push(event);
          }
          return event;
        });

        return followedUser;
      });
    }

    const eventTypes = ['confirm', 'follow', 'recommend', 'subscribe', 'rating', 'newEpisode'];

    const query = {
      _id: { $in: eventIds }, 'agent.item': { $ne: userId }, 'target.item': { $ne: userId }, type: { $in: eventTypes },
    };
    const skip = +offset;
    const limit = 10;
    const sort = { date: -1 };

    const eventsPartial = await findEvents({
      query, skip, limit, sort,
    }).catch(error => error);

    if (eventsPartial.errmsg) return res.status(404).json({ error: eventsPartial });

    const eventsFull = await findEvents({ query }).catch(error => error);

    if (eventsFull.errmsg) return res.status(404).json({ error: eventsFull });

    response.events = await formatEvents(eventsPartial);
    response.next_offset = skip + eventsPartial.length;
    response.morePages = eventsFull.length - skip !== eventsPartial.length;

    return res.status(200).json(response);
  },
};
