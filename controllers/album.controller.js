const Album = require('../models/album.model');
const createError = require('http-errors');
const mongoose = require('mongoose');
const Photo = require('../models/photo.model');
const axios = require('axios');
const { pagination } = require('../middlewares/pagination');

axios.defaults.baseURL = 'https://api.unsplash.com/';

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
            res.status(200).json(album);
        } catch (error) {
            next(error);
        }
    },

    getPhotosByAlbumId: async (req, res, next) => {
        try {
            const user = req.payload;
            const { albumId } = req.params;

            const { sort, page, pageSize, search } = await pagination(
                req,
                res,
                next
            );

            const album = await Album.findOne(
                {
                    _id: albumId,
                    members: { $in: [user.aud] },
                    status: 'ACTIVE',
                },
                {
                    _id: 1,
                }
            );

            if (!album) {
                throw createError(404, 'Album not found');
            }

            const totalElements = await Photo.countDocuments({
                album: { $in: [albumId] },
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { tags: { $in: [search] } },
                ],
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
                    photos: [],
                });
            }

            const totalPages = Math.ceil(totalElements / pageSize);

            const hasNext = page < totalPages;
            const hasPrev = page > 1;

            const photos = await Photo.find(
                {
                    album: { $in: [albumId] },
                    $or: [
                        { title: { $regex: search, $options: 'i' } },
                        { tags: { $in: [search] } },
                    ],
                },
                {
                    _id: 1,
                    title: 1,
                    url: 1,
                    owner: 1,
                    createdAt: 1,
                    // tags: { $slice: 3 },
                }
            )
                .sort({ createdAt: sort === 'asc' ? 1 : -1 })
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .populate('owner', 'fullName username img');

            res.status(200).json({
                pageMeta: {
                    totalPages,
                    page,
                    totalElements,
                    pageSize,
                    hasNext,
                    hasPrev,
                },
                photos,
            });
        } catch (error) {
            next(error);
        }
    },

    createRandomPhotos: async (req, res, next) => {
        try {
            const { albumId } = req.params;
            const { number } = req.query;
            const user = req.payload;
            const album = await Album.findOne(
                {
                    _id: albumId,
                    owner: user.aud,
                    status: 'ACTIVE',
                },
                {
                    _id: 1,
                }
            );

            if (!album) {
                throw createError(404, 'Album not found');
            }

            for (let i = 0; i < number; i++) {
                const response = await axios.get(`/photos/random`, {
                    params: {
                        client_id: process.env.UNSPLASH_ACCESS_KEY,
                    },
                });
                const url = response.data.urls.regular;
                const title = response.data.alt_description.slice(0, 45);
                const tags = response.data.slug.split('-');
                tags.pop();

                const photo = new Photo({
                    title,
                    url,
                    owner: user.aud,
                    tags,
                });

                const savedPhoto = await photo.save();
                savedPhoto.addAlbum(albumId);
                if (!album.photos) {
                    album.photos = [];
                }
                await album.addPhoto(savedPhoto._id);

                await new Promise((resolve) => setTimeout(resolve, 1000));
            }

            res.status(201).send({
                message: `${number} Photos created successfully`,
            });
        } catch (error) {
            next(error);
        }
    },
};
