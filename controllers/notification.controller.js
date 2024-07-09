const db = require('../models');
const Notification = db.notification;
const Group = db.group;
const Album = db.album;

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

            const userGroups = await Group.find({
                members: { $in: [user.aud] },
            }).select('_id');
            const groupIds = userGroups.map((group) => group._id);

            const userAlbums = await Album.find({
                members: { $in: [user.aud] },
            }).select('_id');
            const albumIds = userAlbums.map((album) => album._id);

            const notifications = await Notification.find(
                {
                    $or: [
                        { $and: [{ receivers: user.aud }, { type: 'USER' }] },
                        {
                            $and: [
                                { receivers: { $in: groupIds } },
                                { type: 'GROUP' },
                                { user: { $ne: user.aud } },
                            ],
                        },
                        {
                            $and: [
                                { receivers: { $in: albumIds } },
                                { type: 'ALBUM' },
                                { user: { $ne: user.aud } },
                            ],
                        },
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

            const userGroups = await Group.find({
                members: { $in: [user.aud] },
            }).select('_id');
            const groupIds = userGroups.map((group) => group._id);

            const userAlbums = await Album.find({
                members: { $in: [user.aud] },
            }).select('_id');
            const albumIds = userAlbums.map((album) => album._id);

            const notification = await Notification.findOne({
                _id: notificationId,
                $or: [
                    { $and: [{ receivers: user.aud }, { type: 'USER' }] },
                    {
                        $and: [
                            { receivers: { $in: groupIds } },
                            { type: 'GROUP' },
                            { user: { $ne: user.aud } },
                        ],
                    },
                    {
                        $and: [
                            { receivers: { $in: albumIds } },
                            { type: 'ALBUM' },
                            { user: { $ne: user.aud } },
                        ],
                    },
                ],
            });

            if (!notification) {
                throw createError.NotFound('Notification not found');
            }

            await notification.markAsSeen(user.aud);

            res.status(200).json({
                message: 'Notification marked as seen',
            });
        } catch (error) {
            next(error);
        }
    },
};
