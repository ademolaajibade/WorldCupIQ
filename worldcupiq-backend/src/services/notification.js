const { Expo } = require('expo-server-sdk');
const User = require('../models/User');

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

/**
 * Send push notifications to a list of tokens.
 * Automatically chunks into batches of 100 (Expo SDK limit).
 */
const sendPushNotification = async (tokens, title, body, data = {}) => {
  const messages = tokens
    .filter((t) => Expo.isExpoPushToken(t.token))
    .map((t) => ({
      to: t.token,
      sound: 'default',
      title,
      body,
      data,
    }));

  if (messages.length === 0) return;

  const chunks = expo.chunkPushNotifications(messages);
  const invalidTokens = [];

  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((ticket, i) => {
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
          invalidTokens.push(messages[i].to);
        }
      });
    } catch (err) {
      console.error('Push notification chunk failed:', err.message);
    }
  }

  // Deactivate invalid tokens in DB
  if (invalidTokens.length > 0) {
    await User.updateMany(
      { 'pushTokens.token': { $in: invalidTokens } },
      { $set: { 'pushTokens.$[t].active': false } },
      { arrayFilters: [{ 't.token': { $in: invalidTokens } }] }
    );
  }
};

/**
 * Send a notification to a single user by userId.
 */
const notifyUser = async (userId, title, body, data = {}) => {
  const user = await User.findById(userId).select('pushTokens settings');
  if (!user) return;

  const activeTokens = user.pushTokens.filter((t) => t.active);
  if (activeTokens.length === 0) return;

  await sendPushNotification(activeTokens, title, body, data);
};

module.exports = { sendPushNotification, notifyUser };
