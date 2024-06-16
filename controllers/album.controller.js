const Album = require('../models/album.model');
const createError = require('http-errors');
const mongoose = require('mongoose');
const Photo = require('../models/photo.model');

module.exports = {
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
    getMembersByAlbumId: async (req, res, next) => {
        try {
            const { albumId } = req.params;
            const { limit } = req.query;
            const user = req.payload;

            const parsedLimit = parseInt(limit);
            if (isNaN(parsedLimit)) {
                throw createError(400, 'Invalid limit value');
            }
            const limitValue =
                Math.abs(parsedLimit) > 10 ? 10 : Math.abs(parsedLimit);

            const album = await Album.findOne({
                _id: albumId,
                status: 'ACTIVE',
                members: { $in: [user.aud] },
            }).populate({
                path: 'members',
                select: 'fullName username img',
                options: { limit: limitValue, sort: { _id: -1 } },
            });
            if (!album) {
                throw createError(404, 'Album not found');
            }
            res.json(album.members);
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
            res.json(album.members);
        } catch (error) {
            next(error);
        }
    },

    getPhotosByAlbumId: async (req, res, next) => {
        try {
            const user = req.payload;
            const { albumId } = req.params;
            const { sort = 'desc', page = 1, pageSize = 10 } = req.query;

            const parsedPage = parseInt(page);
            const parsedPageSize = parseInt(pageSize);
            if (isNaN(parsedPage)) {
                throw createError(400, 'Invalid page value');
            }
            if (isNaN(parsedPageSize)) {
                throw createError(400, 'Invalid pageSize value');
            }
            if (parsedPageSize > 30) {
                throw createError(400, 'pageSize must be at most 30');
            }
            if (parsedPageSize < 1) {
                throw createError(400, 'pageSize must be at least 1');
            }

            const album = await Album.findOne({
                _id: albumId,
                status: 'ACTIVE',
                members: { $in: [user.aud] },
            }).populate({
                path: 'photos',
                select: 'title url owner ',
                options: {
                    sort: { _id: sort === 'asc' ? 1 : -1 },
                },
                populate: {
                    path: 'owner',
                    select: 'fullName username img',
                },
            });
            if (!album) throw createError(404, 'Album not found');

            const totalElements = await Photo.countDocuments({
                _id: { $in: album.photos },
            });
            const totalPages = Math.ceil(totalElements / parsedPageSize);

            const photos = await Photo.find({
                _id: { $in: album.photos },
            })
                .sort({ _id: sort === 'asc' ? 1 : -1 })
                .skip((parsedPage - 1) * parsedPageSize)
                .limit(parsedPageSize)
                .populate('owner', 'fullName username img');

            const hasNext = parsedPage < totalPages;
            const hasPrev = parsedPage > 1;
            console.log(
                parsedPage,
                totalPages,
                totalElements,
                parsedPageSize,
                hasNext,
                hasPrev
            );

            res.json({
                pageMeta: {
                    totalPages,
                    page: parsedPage,
                    totalElements,
                    pageSize: parsedPageSize,
                    hasNext,
                    hasPrev,
                },
                photos,
            });

            res.status(200).json(album);
        } catch (error) {
            next(error);
        }
    },
};
