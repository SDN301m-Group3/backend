const { createGroupFormSchema } = require('../configs/validation.config');
const Group = require('../models/group.model');
const createError = require('http-errors');
const mongoose = require('mongoose');
const Album = require('../models/album.model');

// get all groups that user joins
module.exports = {
    getAllGroupsWithUser: async (req, res, next) => {
        try {
            const user = req.payload;

            const groups = await Group.aggregate([
                { $match: { members: new mongoose.Types.ObjectId(user.aud) } },
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
                { $match: { owner: new mongoose.Types.ObjectId(user.aud) } },
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
            const albums = await Album.find(
                {
                    group: groupId,
                    members: { $in: [user.aud] },
                    status: 'ACTIVE',
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
            const group = await Group.findOne(
                {
                    _id: groupId,
                    members: { $in: [user.aud] },
                    status: 'ACTIVE',
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
};
