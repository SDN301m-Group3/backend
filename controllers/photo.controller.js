const db = require('../models');
const createError = require('http-errors');
const Photo = db.photo;
const axios = require('axios');
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
};
