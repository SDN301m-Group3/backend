const Album = require('../models/album.model');
const createError = require('http-errors');
const mongoose = require('mongoose');
const Photo = require('../models/photo.model');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const axios = require('axios');
const { pagination } = require('../middlewares/pagination');
const MailerService = require('../services/mailer.service');
const client = require('../configs/redis.config');
const { randomUUID } = require('crypto');
const Group = require('../models/group.model');

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

            const searchQuery =
                search === ''
                    ? { album: albumId }
                    : {
                          album: albumId,
                          $or: [
                              { title: { $regex: search, $options: 'i' } },
                              { tags: { $in: [search] } },
                          ],
                      };

            const totalElements = await Photo.countDocuments(searchQuery);

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

            photos = await Photo.find(searchQuery, {
                _id: 1,
                title: 1,
                url: 1,
                owner: 1,
                createdAt: 1,
                // tags: { $slice: 3 },
            })
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

    uploadPhotoToAlbum: async (req, res, next) => {
        try {
            const { albumId } = req.params;
            const user = req.payload;
            const savedPhoto = req.file;

            if (!savedPhoto) {
                return res.status(400).send('No file uploaded.');
            }

            const album = await Album.findOne({
                _id: albumId,
                members: { $in: [user.aud] },
                status: 'ACTIVE',
            });

            if (!album) {
                throw createError(404, 'Album not found');
            }

            const photo = await Photo.create({
                url: savedPhoto.location,
                owner: user.aud,
                album: albumId,
            });

            await album.addPhoto(photo._id);

            const newNoti = await Notification.create({
                user: user.aud,
                type: 'ALBUM',
                receivers: album._id,
                content: `${user.username} added a new photo to album ${album.title}`,
                redirectUrl: `/photo/${photo._id}`,
            });

            album.members.forEach(async (member) => {
                if (member.toString() !== user.aud) {
                    const memberNoti = await User.findById({
                        _id: member,
                    });
                    await memberNoti.addNotification(newNoti._id);

                    await MailerService.sendUserUploadPhotoEmail(
                        memberNoti,
                        user,
                        photo,
                        album
                    );
                }
            });

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
                receivers: album.members,
                seen: newNoti.seen,
                albumId: album._id,
            });
        } catch (error) {
            next(error);
        }
    },

    inviteUserToAlbum: async (req, res, next) => {
        try {
            const user = req.payload;
            const { albumId } = req.params;
            const { email } = req.body;

            const album = await Album.findById({
                _id: albumId,
                members: { $in: [user.aud] },
                status: 'ACTIVE',
            });

            if (!album) {
                throw createError(404, 'Album not found');
            }

            const invitedUser = await User.findOne({
                email,
                status: 'ACTIVE',
            });
            if (!invitedUser) {
                throw createError(404, 'User not found');
            }
            if (album.members.includes(invitedUser._id)) {
                throw createError(400, 'User already in album');
            }

            const inviteToken = `${randomUUID()}${randomUUID()}`.replace(
                /-/g,
                ''
            );

            // 3 days
            const INVITE_EXPIRED_TIME = 259200;

            await client.set(
                `inviteToken-${inviteToken}`,
                JSON.stringify({
                    userId: user.aud,
                    albumId: album._id,
                    invitedUserId: invitedUser._id,
                }),
                'EX',
                INVITE_EXPIRED_TIME
            );

            const newNoti = await Notification.create({
                user: user.aud,
                type: 'USER',
                receivers: invitedUser._id,
                content: `You have been invited to join the album ${album.title}`,
                redirectUrl: `/albums/${album._id}/invite?inviteToken=${inviteToken}`,
            });

            await invitedUser.addNotification(newNoti._id);

            await MailerService.sendInviteToAlbumEmail(
                invitedUser,
                album,
                inviteToken
            );

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
                receivers: invitedUser._id,
                seen: newNoti.seen,
            });
        } catch (error) {
            next(error);
        }
    },

    acceptInvitationToAlbum: async (req, res, next) => {
        try {
            const user = req.payload;
            const { albumId } = req.params;
            const inviteToken = req.query.inviteToken;

            const album = await Album.findById(
                {
                    _id: albumId,
                    status: 'ACTIVE',
                    members: { $nin: [user.aud] },
                },
                {
                    _id: 1,
                    members: 1,
                }
            );

            if (!album) {
                throw createError(404, 'Album not found or you are already in');
            }

            const inviteTokenData = await client.get(
                `inviteToken-${inviteToken}`
            );
            if (!inviteTokenData) {
                throw createError(400, 'Invite token is invalid');
            }

            const {
                userId: inviteTokenUserId,
                albumId: inviteTokenAlbumId,
                invitedUserId,
            } = JSON.parse(inviteTokenData);

            if (
                !(await Album.findOne({
                    _id: inviteTokenAlbumId,
                    members: { $in: [inviteTokenUserId] },
                    status: 'ACTIVE',
                }))
            ) {
                throw createError(404, 'Album not found or you already in');
            }
            if (invitedUserId !== user.aud) {
                throw createError(400, 'Invalid user invite');
            }
            if (albumId !== inviteTokenAlbumId) {
                throw createError(400, 'Invalid album invite');
            }

            const invitedUser = await User.findById(
                { _id: invitedUserId },
                { groups: 1 }
            );

            await album.addMember(user.aud);
            const group = await Group.findOne(
                {
                    albums: { $in: [inviteTokenAlbumId] },
                    members: { $nin: [invitedUserId] },
                },
                { _id: 1, members: 1 }
            );

            if (group) {
                await group.addMember(user.aud);
                await invitedUser.addGroup(group._id);
            }

            await client.del(`inviteToken-${inviteToken}`);
            res.status(200).json(album);
        } catch (error) {
            next(error);
        }
    },
};
