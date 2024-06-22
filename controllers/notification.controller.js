const db = require('../models');
const Notification = db.notification;
const Group = db.group;

module.exports = {
    getUserNotifications: async (req, res, next) => {
        try {
            // TODO: Pagination,...
            const user = req.payload;
            const { limit = 10 } = req.query;

            const parsedLimit = parseInt(limit);
            if (isNaN(parsedLimit)) {
                throw createError.BadRequest('Invalid limit');
            }

            const userGroups = await Group.find({ members: user.aud }).select(
                '_id'
            );
            const groupIds = userGroups.map((group) => group._id);

            const notifications = await Notification.find(
                {
                    $or: [
                        { receivers: user.aud },
                        { receivers: { $in: groupIds } },
                    ],
                },
                {
                    _id: 1,
                    user: 1,
                    type: 1,
                    receivers: 1,
                    content: 1,
                    seen: 1,
                    redirectUrl: 1,
                    createdAt: 1,
                }
            )
                .populate('user', 'username fullName email img')
                .sort({ createdAt: -1 })
                .limit(parsedLimit);
            res.status(200).json(notifications);
        } catch (error) {
            next(error);
        }
    },
    markAsSeen: async (req, res, next) => {
        try {
            const user = req.payload;
            const { notificationId } = req.params;

            const userGroups = await Group.find({ members: user.aud }).select(
                '_id'
            );
            const groupIds = userGroups.map((group) => group._id);

            const notification = await Notification.findOne({
                _id: notificationId,
                $or: [
                    { receivers: user.aud },
                    { receivers: { $in: groupIds } },
                ],
            });

            if (!notification) {
                throw createError.NotFound('Notification not found');
            }

            notification.seen = true;
            await notification.save();
        } catch (error) {
            next(error);
        }
    },
};
