const express = require('express');
const notiRouter = express.Router();
const { NotificationController } = require('../controllers');
const { JwtConfig } = require('../configs');

notiRouter.get(
    '/my-notifications',
    JwtConfig.verifyAccessToken,
    NotificationController.getUserNotifications
);

notiRouter.put(
    '/:notificationId/mark-as-seen',
    JwtConfig.verifyAccessToken,
    NotificationController.markAsSeen
);

module.exports = notiRouter;
