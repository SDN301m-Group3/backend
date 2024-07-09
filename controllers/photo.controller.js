const db = require('../models');
const createError = require('http-errors');
const Photo = db.photo;
const Album = db.album;
const User = db.user;
const Notification = db.notification;
const MailerService = require('../services/mailer.service');
const React = db.react;
const Comment = db.comment;
const History = db.history;
const { pagination } = require('../middlewares/pagination');

module.exports = {
    getPhotoById: async (req, res, next) => {
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
                throw createError(
                    403,
                    'You do not have permission to access this photo'
                );
            }

            const history = await History.findOne({
                user: user.aud,
                photo: id,
                actionType: 'VIEW',
            });

            if (history) {
                await history.updateOne({ updatedAt: new Date() });
            } else {
                const newHistory = await History.create({
                    user: user.aud,
                    photo: id,
                    actionType: 'VIEW',
                });
                await User.updateOne(
                    { _id: user.aud },
                    { $addToSet: { histories: newHistory._id } }
                );
            }

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
                    select: '_id title group',
                    populate: {
                        path: 'group',
                        select: '_id title',
                    },
                });

            if (!photo) {
                throw createError(404, 'Photo not found');
            }

            res.status(200).json({
                _id: photo._id,
                title: photo.title,
                tags: photo.tags,
                url: photo.url,
                createdAt: photo.createdAt,
                owner: photo.owner,
                album: {
                    _id: photo.album._id,
                    title: photo.album.title,
                },
                group: {
                    _id: photo.album.group._id,
                    title: photo.album.group.title,
                },
            });
        } catch (error) {
            next(error);
        }
    },

    getCommentByPhotoId: async (req, res, next) => {
        try {
            const { id } = req.params;
            const user = req.payload;

            const { sort, page, pageSize, search } = await pagination(
                req,
                res,
                next
            );

            const album = await Album.findOne(
                {
                    photos: { $in: [id] },
                    status: 'ACTIVE',
                    members: { $in: [user.aud] },
                },
                { _id: 1 }
            );

            if (!album) {
                throw createError(
                    403,
                    'You do not have permission to access this photo'
                );
            }

            const totalElements = await Comment.countDocuments({
                photo: id,
            });

            if (totalElements === 0) {
                return res.status(200).json({
                    pageMeta: {
                        totalPages: 0,
                        page,
                        totalElements: 0,
                        pageSize,
                        hasNext: false,
                        hasPrev: false,
                    },
                    comments: [],
                });
            }

            const totalPages = Math.ceil(totalElements / pageSize);
            const hasNext = page < totalPages;
            const hasPrev = page > 1;

            const comments = await Comment.find(
                {
                    photo: id,
                    status: 'ACTIVE',
                },
                {
                    _id: 1,
                    content: 1,
                    createdAt: 1,
                }
            )
                .sort({ createdAt: sort === 'asc' ? 1 : -1 })
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .populate('user', '_id fullName username email');

            if (!comments) {
                throw createError(404, 'Comments not found');
            }

            res.status(200).json({
                pageMeta: {
                    totalPages,
                    page,
                    totalElements,
                    pageSize,
                    hasNext,
                    hasPrev,
                },
                comments,
            });
        } catch (error) {
            next(error);
        }
    },

    getReactByPhotoId: async (req, res, next) => {
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
                throw createError(
                    403,
                    'You do not have permission to access this photo'
                );
            }

            const reacts = await React.find(
                {
                    photo: id,
                },
                {
                    _id: 1,
                    createdAt: 1,
                }
            ).populate('user', '_id fullName username email');
            if (!reacts) {
                throw createError(404, 'Reacts not found');
            }
            res.status(200).json(reacts);
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
            const newComment = new Comment({
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

    recentViewPhotos: async (req, res, next) => {
        try {
            const user = req.payload;
            const { limit = 10 } = req.query;

            const parseLimit = parseInt(limit);

            if (isNaN(parseLimit) || parseLimit < 1 || parseLimit > 30) {
                throw createError.BadRequest('Invalid limit');
            }

            const photo = await History.find(
                {
                    user: user.aud,
                    actionType: 'VIEW',
                },
                {
                    _id: 1,
                    photo: 1,
                    actionType: 1,
                    createdAt: 1,
                    updatedAt: 1,
                }
            )
                .populate({
                    path: 'photo',
                    select: '_id title url owner album',
                    populate: [
                        {
                            path: 'owner',
                            select: '_id username email fullName img',
                        },
                        {
                            path: 'album',
                            select: '_id title group',
                            populate: {
                                path: 'group',
                                select: '_id title',
                            },
                        },
                    ],
                })
                .sort({ updatedAt: -1 })
                .limit(parseLimit);

            res.status(200).json(photo);
        } catch (error) {
            console.log(error);
            next(error);
        }
    },
};
