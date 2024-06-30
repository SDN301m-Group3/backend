const db = require('../models');
const createError = require('http-errors');
const Group = require('../models/group.model');
const Photo = db.photo;
const Comment = db.comment;
// const React = require('react');

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
            const photo = await Photo.findOne(
                { _id: id, status: 'ACTIVE', owner: user.aud },
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
            res.status(200).json(comments);
        } catch (error) {
            next(error);
        }
    },

    // getReactByPhotoId: async (req, res, next) => {
    //     try {
    //         const { id } = req.params;
    //         const reacts = await React.find(
    //             {
    //                 photoId: id,
    //                 status: 'ACTIVE',
    //             },
    //             {
    //                 _id: 1,
    //                 type: 1,
    //                 createdAt: 1,
    //             }
    //         ).populate('user', '_id fullName username email');
    //         res.status(200).json(reacts);
    //     } catch (error) {
    //         next(error);
    //     }
    // }
};
