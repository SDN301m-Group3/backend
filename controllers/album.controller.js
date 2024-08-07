const Album = require('../models/album.model');
const createError = require('http-errors');
const Photo = require('../models/photo.model');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const History = require('../models/history.model');
const axios = require('axios');
const MailerService = require('../services/mailer.service');
const client = require('../configs/redis.config');
const { randomUUID } = require('crypto');
const Group = require('../models/group.model');
const EmailQueueService = require('../services/emailQueue.service');

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
            const isUserInGroup = await Group.exists({
                _id: album.group._id,
                members: { $in: [user.aud] },
            });

            if (!isUserInGroup) {
                throw createError(403, 'User is not a member of the group');
            }
            res.status(200).json(album);
        } catch (error) {
            next(error);
        }
    },
    updateAlbumById: async (req, res, next) => {
        const ALLOW_CHANGE_FIELDS = ['title'];
        const user = req.payload;
        const { albumId } = req.params;
        const changes = req.body;

        const album = await Album.findOne({ _id: albumId })
            .belongTo(user.aud)
            .isActive();
        if (!album) throw createError(404, 'Album not found');

        const isChangeAllowed = Object.keys(changes).every((key) =>
            ALLOW_CHANGE_FIELDS.includes(key)
        );
        if (!isChangeAllowed) throw createError(400, 'Invalid change fields');

        const { acknowledged } = await album.updateOne(changes);
        if (!acknowledged) throw createError(500, 'Internal server error');

        res.status(200).json({
            message: 'Album updated successfully',
            albumId,
            changes,
        });
    },
    getPhotosByAlbumId: async (req, res, next) => {
        try {
            const user = req.payload;
            const { albumId } = req.params;

            const { sort, page, pageSize, search } = req.pagination;

            const album = req.album;

            const isUserInGroup = await Group.exists({
                _id: album.group.toString(),
                members: { $in: [user.aud] },
            });

            if (!isUserInGroup) {
                throw createError(403, 'User is not a member of the group');
            }

            const searchQuery =
                search === ''
                    ? { album: albumId, status: 'ACTIVE' }
                    : {
                          album: albumId,
                          status: 'ACTIVE',
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

            const photos = await Photo.find(searchQuery, {
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

            const album = req.album;

            const isUserInGroup = await Group.exists({
                _id: album.group.toString(),
                members: { $in: [user.aud] },
            });

            if (!isUserInGroup) {
                throw createError(403, 'User is not a member of the group');
            }

            const photo = await Photo.create({
                url: savedPhoto.location,
                owner: user.aud,
                album: albumId,
                mimeType: savedPhoto.mimetype,
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

                    // await MailerService.sendUserUploadPhotoEmail(
                    //     memberNoti,
                    //     user,
                    //     photo,
                    //     album
                    // );
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

    removePhotoFromAlbum: async (req, res, next) => {
        try {
            const albumId = req.params.albumId;
            const photoId = req.params.photoId;
            const user = req.payload;

            const album = await Album.findOne({
                _id: albumId,
                members: { $in: [user.aud] },
                status: 'ACTIVE',
            });

            if (!album) {
                throw createError(404, 'Album not found');
            }

            const photo = await Photo.findOne({
                _id: photoId,
                album: albumId,
                owner: user.aud,
            });

            if (!photo) {
                throw createError(404, 'Photo not found');
            }

            if (photo.owner.toString() !== user.aud) {
                throw createError(
                    403,
                    'Permission denied. You are not the owner of this photo.'
                );
            }

            await Photo.updateOne(
                { _id: photo._id },
                { $set: { status: 'DELETED' } }
            );

            await History.create({
                user: user.aud,
                actionType: 'DELETE',
                photo: photo._id,
            });

            const newNoti = await Notification.create({
                user: user.aud,
                type: 'ALBUM',
                receivers: album._id,
                content: `${user.username} removed a photo from album ${album.title}`,
                redirectUrl: `/photo/${photo._id}`,
            });

            album.members.forEach(async (member) => {
                if (member.toString() !== user.aud) {
                    const memberNoti = await User.findById(member);
                    await memberNoti.addNotification(newNoti._id);
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

            const album = req.album;

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
                redirectUrl: `/album/${album._id}/invite?inviteToken=${inviteToken}`,
            });

            await invitedUser.addNotification(newNoti._id);

            EmailQueueService.add({
                type: 'inviteToAlbum',
                data: {
                    user: invitedUser,
                    album,
                    inviteToken,
                },
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

    modifyAlbum: async (req, res, next) => {
        try {
            const user = req.payload;
            const { albumId } = req.params;
            const { title, description, status } = req.body;

            const album = await Album.findOne({
                _id: albumId,
                status: 'ACTIVE',
            }).populate('group', 'owner');

            if (!album) {
                throw createError(404, 'Album not found');
            }

            if (
                album.owner.toString() !== user.aud &&
                album.group?.owner.toString() !== user.aud
            ) {
                throw createError(
                    403,
                    'You do not have permission to modify this album'
                );
            }

            const oldAlbumTitle = album.title;

            album.title = title || album.title;
            album.description = description || album.description;
            album.status = status || album.status;

            const updatedAlbum = await album.save();

            const newNoti = await Notification.create({
                user: user.aud,
                type: 'ALBUM',
                receivers: album._id,
                content: `${user.username} updated the information of album ${oldAlbumTitle}`,
                redirectUrl: `/album/${album._id}`,
            });

            album.members.forEach(async (member) => {
                if (member.toString() !== user.aud) {
                    const memberNoti = await User.findById({
                        _id: member,
                    });
                    await memberNoti.addNotification(newNoti._id);

                    EmailQueueService.add({
                        type: 'userAlbumUpdate',
                        data: {
                            user: memberNoti,
                            owner: user,
                            album,
                        },
                    });
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

    shareAlbum: async (req, res, next) => {
        try {
            const user = req.payload;
            const { albumId } = req.params;
            const { time } = req.body;

            const SHARE_EXPIRED_TIME = time;

            if (isNaN(SHARE_EXPIRED_TIME)) {
                throw createError(400, 'Invalid time value');
            }

            const album = await Album.findOne({
                _id: albumId,
                members: { $in: [user.aud] },
                status: 'ACTIVE',
            });

            const shareToken = `${randomUUID()}${randomUUID()}`.replace(
                /-/g,
                ''
            );

            const expiredTime = new Date(
                Date.now() + SHARE_EXPIRED_TIME * 1000
            );

            await client.set(
                `user-share-album-${shareToken}`,
                JSON.stringify({
                    userId: user.aud,
                    albumId: album._id,
                    expiredTime: expiredTime.toISOString(),
                }),
                'EX',
                SHARE_EXPIRED_TIME
            );

            res.status(200).json({
                shareToken,
                expiredTime,
            });
        } catch (error) {
            next(error);
        }
    },

    getPhotosByShareAlbum: async (req, res, next) => {
        try {
            const { shareToken } = req.query;

            console.log(shareToken);

            const shareTokenData = await client.get(
                `user-share-album-${shareToken}`
            );

            if (!shareTokenData) {
                throw createError(400, 'Share token is invalid');
            }

            const { userId, albumId, expiredTime } = JSON.parse(shareTokenData);

            if (new Date(expiredTime) < new Date()) {
                throw createError(400, 'Share token is expired');
            }

            const album = await Album.findById(
                {
                    _id: albumId,
                    status: 'ACTIVE',
                },
                {
                    _id: 1,
                }
            );

            if (!album) {
                throw createError(404, 'Album not found');
            }

            const { sort, page, pageSize, search } = req.pagination;

            const searchQuery =
                search === ''
                    ? { album: albumId, status: 'ACTIVE' }
                    : {
                          album: albumId,
                          status: 'ACTIVE',
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

            const photos = await Photo.find(searchQuery, {
                _id: 1,
                title: 1,
                url: 1,
                createdAt: 1,
            })
                .sort({ createdAt: sort === 'asc' ? 1 : -1 })
                .skip((page - 1) * pageSize)
                .limit(pageSize);

            const user = await User.findById(
                {
                    _id: userId,
                },
                {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    email: 1,
                    img: 1,
                }
            );

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
                shareUser: user,
                expiredTime,
            });
        } catch (error) {
            next(error);
        }
    },
};
