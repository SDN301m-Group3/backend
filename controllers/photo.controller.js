const db = require('../models');
const createError = require('http-errors');
const Photo = db.photo;
const React = db.react;
const Comment = db.comment;
const Album = db.album;
const mongoose = require('mongoose');
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

            console.log(await Album.findOne({ photos: { $in: [id] } }));

            if (!album) {
                throw createError(
                    403,
                    'You do not have permission to access this photo'
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

    addCommentToPhoto: async (req, res, next) => {
        try {
            const { id } = req.params;
            const user = req.payload;
            const { content } = req.body;

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

            console.log(id, user.aud, content);
            const comment = new Comment({
                photo: new mongoose.Types.ObjectId(id),
                user: new mongoose.Types.ObjectId(user.aud),
                content,
            });
            console.log(comment);
            await comment.save();
            console.log('210');
            res.status(201).json(comment);
        } catch (error) {
            next(error);
        }
    },

    addReactToPhoto: async (req, res, next) => {
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

            const react = new React({
                photo: new mongoose.Types.ObjectId(id),
                user: new mongoose.Types.ObjectId(user.aud),
            });
            await react.save();
            res.status(201).json(react);
        } catch (error) {
            next(error);
        }
    },
};
