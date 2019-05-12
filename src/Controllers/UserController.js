import uuidv4 from 'uuid/v4';
import * as User from '../lib/User';
import { hashPassword } from '../Helpers/db';
import { createMetaUser, handleMetaUserUpdate } from '../lib/MetaUser';
import { createSession, deleteSession } from '../lib/Session';
import { uploadProfileImageToCloudinary, invalidImage } from '../Helpers/cloudinary';
import { deleteEvents, findEvents } from '../lib/Event';
import { deleteNotifications, findNotification, deleteNotification } from '../lib/Notification';
import { deleteCategories } from '../lib/Category';
import { deleteSubscription } from '../lib/Subscriptions';

export default {
  async create(req, res) {
    const { body } = req;
    const metaUserId = uuidv4();
    const {
      username, email, password, type,
    } = await User.verifytoken(body.token);
    if (type === 'admin' && !req.isAdmin) return res.status(403).json({ error: 'Forbidden', message: 'You are not Authorzied to create admin accounts' });
    const user = await User.createUser({
      _id: uuidv4(),
      username,
      email,
      password,
      type,
      metaUser: metaUserId,
    }).catch(error => error);

    if (user.errmsg) {
      let message;
      if (user.errmsg.includes('username')) {
        message = 'Username is already in use';
      } else if (user.errmsg.includes('email')) {
        message = 'Email is already in registered';
      }

      return res.status(500).json({ error: user, message });
    }

    const metaUser = await createMetaUser({
      _id: metaUserId,
      user: user.id,
    }).catch(error => error);

    if (metaUser.errmsg) return res.status(500).json({ error: metaUser, message: 'Error creating the metaUser' });

    const session = await createSession({ user: user._id }).catch(error => error);

    if (session.errmsg) return res.status(500).json({ error: session });

    const token = await User.auth(req.body).catch(error => error);

    if (token.errmsg) return res.status(500).json({ error: token });

    return res.status(200).json({ token });
  },
  async find(req, res) {
    const user = await User.findUserById(req.params.userId).catch(error => error);

    if (user.errmsg) return res.status(500).json({ error: user, message: 'Error occurred when trying to find the user' });

    return res.status(200).json({ user: User.filterFields(user) });
  },
  async auth(req, res) {
    const token = await User.auth(req.body).catch(error => error);

    if (token.errmsg) return res.status(500).json({ error: token });

    return res.status(200).json({ token });
  },
  async me(req, res) {
    const user = await User.findUserById(req.userId).catch(error => error);

    if (user.errmsg) return res.status(500).json({ error: user, message: 'Error occurred when trying to find the user' });

    return res.status(200).json({ user: User.filterFields(user) });
  },
  async update(req, res) {
    if (req.body.password) {
      const password = await User.verifytoken(req.body.password);
      req.body.password = await hashPassword(password);
    }

    if (req.params.userId && !req.isAdmin) return res.status(403).json({ error: 'Forbidden', message: 'You are not Authorzied to update this user' });
    if (req.body.type === 'admin' && !req.isAdmin) return res.status(403).json({ error: 'Forbidden', message: 'You are not Authorzied to update this users type to admin' });
    if (req.uploadError) return res.status(req.uploadError.status).json({ error: req.uploadError });

    const userId = req.params.userId ? req.params.userId : req.userId;

    if (req.file) {
      if (await invalidImage(req.file)) return res.status(403).json({ error: { errmsg: 'The file content does not match the announced filetype this sugests that the file type has been manipulated' } });

      const uploadedImage = await uploadProfileImageToCloudinary(userId, req.file.path)
        .catch(error => error);

      if (uploadedImage.errmsg) {
        return res.status(uploadedImage.status).json({ error: uploadedImage });
      }

      req.body.profile_img = {
        thumb: uploadedImage.eager[0].secure_url.replace(/(w_|h_)(660)/g, '$1150'),
        standard: uploadedImage.eager[0].secure_url.replace(/(w_|h_)(660)/g, '$1400'),
        large: uploadedImage.eager[0].secure_url,
      };
    }
    const response = await User.handleUserUpdate(userId, req.body).catch(error => error);

    if (response.errmsg) return res.status(500).json({ error: response });
    const modifyedFields = Object.keys(req.body).map((key, index, array) => {
      if (index === array.length - 1) {
        return `${key} `;
      }
      if (index === array.length - 2) {
        return `${key} and `;
      }
      return `${key}, `;
    }).reduce((accumulator, currentValue) => accumulator + currentValue);
    response.info = `${modifyedFields}was updated`;

    return res.status(200).json(response);
  },
  async delete(req, res) {
    if (req.params.userId && !req.isAdmin) return res.status(403).json({ error: 'Forbidden', message: 'You are not Authorzied to delete this user' });
    const userId = req.params.userId ? req.params.userId : req.userId;
    try {
      const user = await User.findUserById(userId).catch(error => error);

      if (user.errmsg) return res.status(500).json({ error: user, message: 'Error occurred when trying to delete the user' });

      if (user.notifications.length > 0) {
        const query = { _id: { $in: user.notifications } };
        const notifications = await deleteNotifications(query).catch(error => error);

        if (notifications.errmsg) return res.status(500).json({ error: notifications, message: 'Error occurred when trying to delete the user' });
      }
      if (user.events.length > 0) {
        const querySharedEvents = { _id: { $in: user.events }, type: { $nin: ['newEpisode', 'rating', 'subscribe', 'unsubscribe'] } };
        const events = await findEvents({ query: querySharedEvents }).catch(error => error);

        if (!events.errmsg) {
          await Promise.all(events.map(async (event) => {
            const userWithEvent = await User.findOneUser(
              { _id: { $ne: userId }, events: event._id },
            ).catch(error => error);

            if (!userWithEvent.errmsg) {
              const fieldsToUpdate = { events: event._id };
              const query = { user: userWithEvent._id, event: event._id };
              const relatedNotification = await findNotification(query).catch(error => error);

              if (!relatedNotification.errmsg) {
                const deletedNotification = await deleteNotification(
                  { _id: relatedNotification._id },
                ).catch(error => error);

                if (deletedNotification.errmsg) return res.status(500).json({ error: deletedNotification, message: 'Error occurred when trying to delete the user' });

                fieldsToUpdate.notifications = relatedNotification._id;
              }

              const updatedUser = await User.handleUserUpdate(
                userWithEvent._id, fieldsToUpdate,
              ).catch(error => error);

              if (updatedUser.errmsg) return res.status(500).json({ error: updatedUser, message: 'Error occurred when trying to delete the user' });
            }

            return event;
          }));
        }

        const query = { _id: { $in: user.events }, type: { $ne: 'newEpisode' } };
        const deletedEvents = await deleteEvents(query).catch(error => error);

        if (deletedEvents.errmsg) return res.status(500).json({ error: deletedEvents, message: 'Error occurred when trying to delete the user' });
      }

      if (user.categories.length > 0) {
        const deletedCategoires = await deleteCategories(
          { _id: { $in: user.categories } },
        ).catch(error => error);
        if (deletedCategoires.errmsg) return res.status(500).json({ error: deletedCategoires, message: 'Error occurred when trying to delete the user' });
      }

      if (user.subscriptions.length > 0) {
        await Promise.all(user.subscriptions.map(async (subscription) => {
          const query = { _id: { $ne: userId }, subscriptions: subscription };

          const usersWithSubscription = await User.findUsers({ query }).catch(error => error);

          if (usersWithSubscription.errmsg === 'No results where found') {
            const deletedSubscription = await deleteSubscription(
              subscription,
            ).catch(error => error);

            if (deletedSubscription.errmsg) return res.status(500).json({ error: deletedSubscription, message: 'Error occurred when trying to delete the user' });
          }

          return usersWithSubscription;
        }));
      }

      if (user.followers.length > 0) {
        await Promise.all(user.followers.map(async (follower) => {
          const updatedUser = await User.handleUserUpdate(follower, { following: userId });

          if (updatedUser.errmsg) return res.status(500).json({ error: updatedUser, message: 'Error occurred when trying to delete the user' });

          return follower;
        }));
      }

      if (user.following.length > 0) {
        await Promise.all(user.following.map(async (following) => {
          const updatedUser = await User.handleUserUpdate(following, { followers: userId });

          if (updatedUser.errmsg) return res.status(500).json({ error: updatedUser, message: 'Error occurred when trying to delete the user' });

          return following;
        }));
      }

      const query = { requests: userId };

      const userWithRequests = await User.findUsers({ query }).catch(error => error);

      if (userWithRequests.length > 0) {
        await Promise.all(userWithRequests.map(async (requestedUser) => {
          const updatedUser = await User.handleUserUpdate(requestedUser._id, { requests: userId });

          if (updatedUser.errmsg) return res.status(500).json({ error: updatedUser, message: 'Error occurred when trying to delete the user' });

          return requestedUser;
        }));
      }

      const session = await deleteSession({ user: userId }).catch(error => error);

      if (session.errmsg) return res.status(500).json({ error: session, message: 'Error occurred when trying to delete the user' });

      const updatedMetaUser = (
        await handleMetaUserUpdate(user.metaUser, { user: undefined })
          .catch(error => error)
      );

      if (updatedMetaUser.errmsg) return res.status(500).json({ error: updatedMetaUser, message: 'Error occurred when trying to delete the user' });

      const deletedUser = await User.deleteUser({ _id: userId }).catch(error => error);

      if (deletedUser.errmsg) return res.status(500).json({ error: deletedUser, message: 'Error occurred when trying to delete the user' });
    } catch (e) {
      return res.status(500).json({ error: e, message: 'Error occurred when trying to delete the user' });
    }

    return res.status(200).json({ info: 'User was deleted' });
  },
  async follows(req, res) {
    const response = await User.getUserWithPopulatedFollows(req.userId);

    if (response.errmsg) return res.status(500).json({ error: response, message: 'Error occurred when trying to fetch user follows' });

    return res.status(200).json(response);
  },
};
