const db = require('../models');
const createError = require('http-errors');
const Photo = db.photo;
const Album = db.album;
const User = db.user;
const Notification = db.notification;
const MailerService = require('../services/mailer.service');
const comment = db.comment;

// export type PhotoDetail = {
//   _id: string;
//   title: string;
//   tags: string[];
//   url: string;
//   createdAt: string;
//   owner: {
//       _id: string;
//       fullName: string;
//       username: string;
//       email: string;
//       img: string;
//   };
//   group: {
//       _id: string;
//       title: string;
//   };
//   album: {
//       _id: string;
//       title: string;
//   };
// };

module.exports = {
    getPhotoById: async (req, res, next) => {
        try {
            const { id } = req.params;
            const photo = await Photo.findOne(
                { _id: id, status: 'ACTIVE' },
                {
                    _id: 1,
                    title: 1,
                    tags: 1,
                    url: 1,
                    createdAt: 1,
                }
            )
                .populate('owner', '_id fullName username email img')
                .populate({
                    path: 'album',
                    select: '_id title',
                    populate: {
                        path: 'group',
                        select: '_id title',
                    },
                });
            if (!photo) {
                throw createError(404, 'Photo not found');
            }
            res.status(200).json(photo);
        } catch (error) {
            next(error);
        }
    },

    getCommentByPhotoId: async (req, res, next) => {
        try {
            const { id } = req.params;
            const comments = await comment
                .find(
                    {
                        photoId: id,
                        status: 'ACTIVE',
                    },
                    {
                        _id: 1,
                        content: 1,
                        createdAt: 1,
                    }
                )
                .populate('user', '_id fullName username email');
            res.status(200).json(comments);
        } catch (error) {
            next(error);
        }
    },

    createComment: async (req, res, next) => {
        try {
            const { id } = req.params;
            const user = req.payload;
            const album = await Album.findOne(
                {
                    photos: { $in: [id] },
                    status: 'ACTIVE',
                    members: { $in: [user.aud] },
                },
                { _id: 1 }
            );

            if (!album) {
                throw createError.Unauthorized(
                    'You are not allowed to comment on this photo'
                );
            }
            const { content } = req.body;
            const newComment = new comment({
                content,
                user: user.aud,
                photo: id,
            });
            await newComment.save();

            await Photo.updateOne(
                { _id: id },
                { $push: { comments: newComment._id } }
            );

            await User.updateOne(
                { _id: user.aud },
                { $push: { comments: newComment._id } }
            );

            const photo = await Photo.findOne(
                { _id: id },
                { owner: 1, title: 1, url: 1 }
            ).populate('owner', '_id username email');

            if (user.aud === photo.owner._id.toString()) {
                res.status(200).json(newComment);
                return;
            }

            const newNoti = await Notification.create({
                user: user.aud,
                type: 'USER',
                receivers: photo.owner._id,
                content: `${user.username} commented on your photo ${photo?.title}`,
                redirectUrl: `/photo/${id}`,
            });

            await User.updateOne(
                { _id: photo.owner._id },
                { $push: { notifications: newNoti._id } }
            );

            await MailerService.sendUserLikePhotoEmail(user, photo, newComment);

            res.status(200).json({
                _id: newNoti._id,
                user: {
                    _id: user.aud,
                    username: user.username,
                    fullName: user.fullName,
                    email: user.email,
                    img: user.img,
                },
                type: newNoti.type,
                content: newNoti.content,
                redirectUrl: newNoti.redirectUrl,
                createdAt: newNoti.createdAt,
                receivers: photo.owner._id,
                seen: newNoti.seen,
            });
        } catch (error) {
            next(error);
        }
    },
};
