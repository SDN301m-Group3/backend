const {
    createGroupFormSchema,
    createAlbumFormSchema,
} = require('../configs/validation.config');
const Group = require('../models/group.model');
const Album = require('../models/album.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const client = require('../configs/redis.config');
const EmailQueueService = require('../services/emailQueue.service');

const createError = require('http-errors');
const mongoose = require('mongoose');
const MailerService = require('../services/mailer.service');
const { randomUUID } = require('crypto');

// get all groups that user joins
module.exports = {
    getAllGroupsWithUser: async (req, res, next) => {
        try {
            const user = req.payload;

            const groups = await Group.aggregate([
                {
                    $match: {
                        members: new mongoose.Types.ObjectId(user.aud),
                        status: 'ACTIVE',
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'owner',
                        foreignField: '_id',
                        as: 'owner',
                    },
                },
                {
                    $unwind: '$owner',
                },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        description: 1,
                        groupImg: 1,
                        'owner.fullName': 1,
                        'owner.email': 1,
                        numberOfAlbums: { $size: '$albums' },
                        numberOfMembers: { $size: '$members' },
                    },
                },
            ]);

            res.send(groups);
        } catch (error) {
            next(error);
        }
    },

    getMyGroups: async (req, res, next) => {
        try {
            const user = req.payload;
            // const groups = await Group.find({ owner: user.aud })
            //     .select('_id title description')
            //     .populate('owner', 'fullName email')

            const groups = await Group.aggregate([
                {
                    $match: {
                        owner: new mongoose.Types.ObjectId(user.aud),
                        status: 'ACTIVE',
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'owner',
                        foreignField: '_id',
                        as: 'owner',
                    },
                },
                {
                    $unwind: '$owner',
                },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        description: 1,
                        groupImg: 1,
                        'owner.fullName': 1,
                        'owner.email': 1,
                        numberOfAlbums: { $size: '$albums' },
                        numberOfMembers: { $size: '$members' },
                    },
                },
            ]);

            res.send(groups);
        } catch (error) {
            next(error);
        }
    },
    createGroup: async (req, res, next) => {
        try {
            const user = req.payload;
            const { title, description } = createGroupFormSchema.parse(
                req.body
            );

            function generateGroupCode(length) {
                const characters =
                    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                let code = '';
                for (let i = 0; i < length; i++) {
                    const randomIndex = Math.floor(
                        Math.random() * characters.length
                    );
                    code += characters[randomIndex];
                }
                return code;
            }

            let groupCode = generateGroupCode(6);
            while (await Group.findOne({ groupCode })) {
                groupCode = generateGroupCode(6);
            }

            const group = new Group({
                title,
                description,
                groupCode,
                owner: new mongoose.Types.ObjectId(user.aud),
            });
            const savedGroup = await group.save();
            await savedGroup.addMember(user.aud);

            // Update the user's group
            await User.findOneAndUpdate(
                { _id: user.aud },
                { $addToSet: { groups: savedGroup._id } },
                { new: true }
            );

            res.send(savedGroup);
        } catch (error) {
            if (error.errors) {
                const errors = Object.values(error.errors).map(
                    (err) => err.message
                );
                error = createError(422, { message: errors.join(', ') });
            }
            next(error);
        }
    },
    getAlbumsByGroupId: async (req, res, next) => {
        try {
            const user = req.payload;
            const { groupId } = req.params;
            const { search = '' } = req.query;

            const group = await Group.findOne(
                {
                    _id: groupId,
                },
                {
                    owner: 1,
                }
            );

            const albums = await Album.find(
                {
                    group: groupId,
                    $and: [
                        group.owner.toString() === user.aud
                            ? {}
                            : { members: { $in: [user.aud] } },
                    ],
                    status: 'ACTIVE',
                    $or: [
                        { title: { $regex: search, $options: 'i' } },
                        { description: { $regex: search, $options: 'i' } },
                    ],
                },
                { _id: 1, title: 1, description: 1, photos: { $slice: -1 } }
            ).populate('photos', 'url');

            res.json(albums);
        } catch (error) {
            next(error);
        }
    },

    getMembersByGroupId: async (req, res, next) => {
        try {
            const user = req.payload;
            const { groupId } = req.params;
            const { limit } = req.query;

            const parsedLimit = parseInt(limit);
            if (isNaN(parsedLimit)) {
                throw createError(400, 'Invalid limit value');
            }
            const limitValue =
                Math.abs(parsedLimit) > 10 ? 10 : Math.abs(parsedLimit);

            const group = await Group.findOne({
                _id: groupId,
                members: { $in: [user.aud] },
            }).populate({
                path: 'members',
                select: 'username fullName img',
                options: { limit: limitValue, sort: { _id: -1 } },
            });

            if (!group) {
                throw createError(404, 'Group not found');
            }

            res.json(group.members);
        } catch (error) {
            next(error);
        }
    },
    getGroupById: async (req, res, next) => {
        try {
            const user = req.payload;
            const { groupId } = req.params;

            // const userAlbum = await Album.find({
            //     members: { $in: [user.aud] },
            // }).select('_id');
            // const albumIds = userAlbum.map((album) => album._id);

            // console.log(albumIds);

            const group = await Group.findOne(
                {
                    _id: groupId,
                    members: { $in: [user.aud] },
                    status: 'ACTIVE',
                    // albums: { $in: albumIds },
                },
                {
                    title: 1,
                    description: 1,
                    groupImg: 1,
                    owner: 1,
                    albums: 1,
                    groupCode: 1,
                    createdAt: 1,
                }
            )
                .populate('owner', '_id fullName username email img')
                .populate('members', '_id fullName username email img')
                .populate('albums', '_id title description');

            if (!group) {
                throw createError(404, 'Group not found');
            }

            res.status(200).json(group);
        } catch (error) {
            next(error);
        }
    },
    createAlbum: async (req, res, next) => {
        try {
            const user = req.payload;
            const { title, description } = createAlbumFormSchema.parse(
                req.body
            );
            const groupId = req.params.groupId;

            const group = await Group.findById(groupId);

            if (!group) {
                throw createError(404, 'Group not found');
            }

            const album = new Album({
                title,
                description,
                owner: new mongoose.Types.ObjectId(user.aud),
                group: new mongoose.Types.ObjectId(groupId),
            });
            const savedAlbum = await album.save();
            await savedAlbum.addMember(user.aud);

            if (group.owner.toString() !== user.aud) {
                await savedAlbum.addMember(group.owner.toString());
            }

            // if i add a album
            await Group.findByIdAndUpdate(req.params.groupId, {
                $addToSet: { albums: savedAlbum._id },
            });
            res.send(savedAlbum);
        } catch (error) {
            if (error.errors) {
                const errors = Object.values(error.errors).map(
                    (err) => err.message
                );
                error = createError(422, { message: errors.join(', ') });
            }
        }
    },
    joinGroup: async (req, res, next) => {
        try {
            const user = req.payload;
            const { groupCode } = req.body;

            const group = await Group.findOne({
                groupCode,
                status: 'ACTIVE',
            });

            if (!group) {
                throw createError(404, 'Group not found');
            }

            if (group.members.includes(user.aud)) {
                throw createError(400, 'You already joined this group');
            }

            await group.addMember(user.aud);

            // Update the user's group
            await User.findOneAndUpdate(
                { _id: user.aud },
                { $addToSet: { groups: group._id } },
                { new: true }
            );

            res.send(group);
        } catch (error) {
            next(error);
        }
    },
    removeGroup: async (req, res, next) => {
        try {
            const user = req.payload;
            const { groupId } = req.params;
            const group = await Group.findById(groupId);
            if (!group) {
                throw createError(404, 'Group not found');
            }
            if (group.owner._id.toString() !== user.aud) {
                throw createError(
                    403,
                    'You do not have permission to remove this group'
                );
            }
            group.status = 'DELETED';
            await group.save();
            await Album.updateMany({ group: groupId }, { status: 'DELETED' });

            const newNoti = await Notification.create({
                user: user.aud,
                type: 'GROUP',
                receivers: group._id,
                content: `The group ${group.title} has been deleted by the owner`,
                redirectUrl: `#`,
            });

            group.members.forEach(async (member) => {
                if (member.toString() === user.aud) return;
                const memberNoti = await User.findById({
                    _id: member,
                });
                await memberNoti.addNotification(newNoti._id);

                EmailQueueService.add({
                    type: 'ownerRemovedGroup',
                    data: {
                        user: memberNoti,
                        group,
                    },
                });
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
                receivers: group.members,
                seen: newNoti.seen,
                groupId: group._id,
            });
        } catch (error) {
            next(error);
        }
    },
    inviteUserToGroup: async (req, res, next) => {
        try {
            const user = req.payload;
            const { groupId } = req.params;
            const { email } = req.body;

            const group = await Group.findById({
                _id: groupId,
                members: { $in: [user.aud] },
            });

            if (!group) {
                throw createError(404, 'Group not found');
            }

            const invitedUser = await User.findOne({
                email,
                status: 'ACTIVE',
            });
            if (!invitedUser) {
                throw createError(404, 'User not found');
            }

            if (group.members.includes(invitedUser._id)) {
                throw createError(400, 'User already joined this group');
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
                    groupId: group.id,
                    invitedUserId: invitedUser._id,
                }),
                'EX',
                INVITE_EXPIRED_TIME
            );

            const newNoti = await Notification.create({
                user: user.aud,
                type: 'USER',
                receivers: invitedUser._id,
                content: `You have been invited to join the group ${group.title}`,
                redirectUrl: `/group/${group._id}/invite?inviteToken=${inviteToken}`,
            });

            await invitedUser.addNotification(newNoti._id);

            EmailQueueService.add({
                type: 'inviteToGroup',
                data: {
                    user: invitedUser,
                    group,
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
    acceptInvitationToGroup: async (req, res, next) => {
        try {
            const user = req.payload;
            const { groupId } = req.params;
            const inviteToken = req.query.inviteToken;

            const group = await Group.findOne({
                _id: groupId,
                members: { $nin: [user.aud] },
            });

            if (!group) {
                throw createError(404, 'Group not found or you already joined');
            }

            const inviteTokenData = await client.get(
                `inviteToken-${inviteToken}`
            );
            if (!inviteTokenData) {
                throw createError(400, 'Invalid invite token');
            }

            const {
                userId: inviteTokenUserId,
                groupId: inviteTokenGroupId,
                invitedUserId,
            } = JSON.parse(inviteTokenData);

            if (
                !(await Group.findOne({
                    _id: inviteTokenGroupId,
                    members: { $in: [inviteTokenUserId] },
                }))
            ) {
                throw createError(400, 'Invalid user invite');
            }

            if (invitedUserId !== user.aud || inviteTokenGroupId !== groupId) {
                throw createError(400, 'Invalid group or user invite');
            }

            await group.addMember(invitedUserId);

            // Update the user's group
            await User.findOneAndUpdate(
                { _id: invitedUserId },
                { $addToSet: { groups: group._id } },
                { new: true }
            );

            await client.del(`inviteToken-${inviteToken}`);

            res.status(200).json(group);
        } catch (error) {
            next(error);
        }
    },
    removeUserFromGroup: async (req, res, next) => {
        try {
            const user = req.payload;
            const { groupId, userId } = req.params;

            const group = await Group.findById(groupId);
            if (!group) {
                throw createError(404, 'Group not found');
            }

            const userToRemove = await User.findById(userId);
            if (!userToRemove) {
                throw createError(404, 'User not found');
            }

            if (group.owner.toString() !== user.aud) {
                throw createError(403, 'You do not have permission');
            }

            if (group.owner.toString() === userId) {
                throw createError(403, 'You cannot remove yourself');
            }

            if (!group.members.includes(userId)) {
                throw createError(404, 'User not found in group');
            }

            await group.removeMember(userId);

            userToRemove.removeGroup(groupId);

            // Remove user from all albums in the group
            const albums = await Album.find({
                group: groupId,
                members: { $in: [userId] },
            });
            for (const album of albums) {
                if (album.owner.toString() === userId) {
                    album.owner = group.owner;
                    await album.save();
                }
                await album.removeMember(userId);
            }

            const newNoti = await Notification.create({
                user: user.aud,
                type: 'USER',
                receivers: userId,
                content: `You have been removed from the group ${group.title}`,
                redirectUrl: `#`,
            });

            await userToRemove.addNotification(newNoti._id);

            EmailQueueService.add({
                type: 'removeUserFromGroup',
                data: {
                    user: userToRemove,
                    group,
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
                receivers: userId,
                seen: newNoti.seen,
            });
        } catch (error) {
            next(error);
        }
    },
    modifyGroup: async (req, res, next) => {
        try {
            const user = req.payload;
            const { groupId } = req.params;
            const { title, description, status, groupImg } = req.body;
            const savedPhoto = req.file;

            const group = await Group.findById(groupId);
            if (!group) {
                throw createError(404, 'Group not found');
            }

            if (group.owner.toString() !== user.aud) {
                throw createError(
                    403,
                    'You do not have permission to modify this group'
                );
            }

            const oldGroupTitle = group.title;
            group.title = title || group.title;
            group.description = description || group.description;
            group.status = status || group.status;

            if (savedPhoto) {
                group.groupImg = savedPhoto.location;
            }

            const updatedGroup = await group.save();

            const newNoti = await Notification.create({
                user: user.aud,
                type: 'GROUP',
                receivers: group._id,
                content: `${user.username} updated the information of group ${oldGroupTitle}`,
                redirectUrl: `/group/${group._id}`,
            });

            group.members.forEach(async (member) => {
                if (member.toString() !== user.aud) {
                    const memberNoti = await User.findById({
                        _id: member,
                    });
                    await memberNoti.addNotification(newNoti._id);

                    await MailerService.sendUserGroupUpdateMail(
                        memberNoti,
                        group
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
                receivers: group.members,
                seen: newNoti.seen,
                groupId: group._id,
            });
        } catch (error) {
            if (error.errors) {
                const errors = Object.values(error.errors).map(
                    (err) => err.message
                );
                error = createError(422, { message: errors.join(', ') });
            }
            next(error);
        }
    },
    outGroup: async (req, res, next) => {
        try {
            const user = req.payload;
            const { groupId } = req.params;

            const group = await Group.findById(groupId);

            if (!group) {
                throw createError(404, 'Group not found');
            }

            if (group.owner.toString() === user.aud) {
                throw createError(400, 'Owner cannot out Group');
            }

            if (!group.members.includes(user.aud)) {
                throw createError(400, 'You are not a member of this group');
            }

            await Group.findOneAndUpdate(
                { _id: group._id },
                { $pull: { members: user.aud } },
                { new: true }
            );

            await User.findOneAndUpdate(
                { _id: user.aud },
                { $pull: { groups: group._id } },
                { new: true }
            );

            // Remove user from all albums in the group
            const albums = await Album.find({
                group: groupId,
                members: { $in: [user.aud] },
            });
            for (const album of albums) {
                if (album.owner.toString() === user.aud) {
                    album.owner = group.owner;
                    await album.save();
                }
                await album.removeMember(user.aud);
            }

            const newNoti = await Notification.create({
                user: user.aud,
                type: 'GROUP',
                receivers: group._id,
                content: `${user.username} has left the group ${group.title}`,
                redirectUrl: `/group/${group._id}`,
            });

            group.members.forEach(async (member) => {
                if (member.toString() !== user.aud) {
                    const memberNoti = await User.findById({
                        _id: member,
                    });
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
                receivers: group.members,
                seen: newNoti.seen,
                groupId: group._id,
            });
        } catch (error) {
            next(error);
        }
    },
};
