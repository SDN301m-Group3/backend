const db = require('../models');
const createError = require('http-errors');
const Photo = db.photo;
const React = db.react;
const Comment = db.comment;
const Album = db.album;

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

            const comments = await Comment.find(
                {
                    photoId: id,
                    status: 'ACTIVE',
                },
                {
                    _id: 1,
                    content: 1,
                    createdAt: 1,
                }
            ).populate('user', '_id fullName username email');
            if (!comments) {
                throw createError(404, 'Comments not found');
            }
            res.status(200).json(comments);
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
                    photoId: id,
                    status: 'ACTIVE',
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
};
