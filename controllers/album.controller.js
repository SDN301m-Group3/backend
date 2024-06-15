const { createAlbumFormSchema } = require('../configs/validation.config');
const Album = require('../models/album.model');
const createError = require('http-errors');
const mongoose = require('mongoose');

module.exports = {
    // createAlbum: async (req, res, next) => {
    //     try {
    //         const user = req.payload;
    //         const { title, description } = createAlbumFormSchema.parse(
    //             req.body
    //         );
    //         const album = new Album({
    //             title,
    //             description,
    //             owner: new mongoose.Types.ObjectId(user.aud),
    //             group: new mongoose.Types.ObjectId(req.params.groupId),
    //         });
    //         const savedAlbum = await album.save();
    //         await savedAlbum.addMember(user.aud);
    //         // if i add a album
    //         res.send(savedAlbum);
    //     } catch (error) {
    //         if (error.errors) {
    //             const errors = Object.values(error.errors).map(
    //                 (err) => err.message
    //             );
    //             error = createError(422, { message: errors.join(', ') });
    //         }
    //         next(error);
    //     }
    // },

    removeAlbum: async (req, res, next) => {
        try {
            const id = req.params.id;
            const user = req.payload;
            await Album.findByIdAndUpdate(
                id,
                { owner: user.aud },
                { new: false }
            ).then((album) => {
                if (!album) {
                    throw createError(404, 'Album not found');
                } else {
                    album.status = 'DELETED';
                    res.send(album);
                }
            });
        } catch (error) {
            next(error);
        }
    },
    getAlbumById: async (req, res, next) => {
        try {
            const user = req.payload;
            const { albumId } = req.params;
            const album = await Album.findOne(
                {
                    _id: albumId,
                    members: { $in: [user.aud] },
                    status: 'ACTIVE',
                },
                {
                    title: 1,
                    description: 1,
                    owner: 1,
                    group: 1,
                    members: 1,
                    createdAt: 1,
                }
            )
                .populate('owner', '_id fullName username email img')
                .populate('group', '_id title description groupImg')
                .populate('members', '_id fullName username email img');

            if (!album) {
                throw createError(404, 'Album not found');
            }

            res.status(200).json(album);
        } catch (error) {
            next(error);
        }
    },
};
