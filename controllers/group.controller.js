const { createGroupFormSchema } = require('../configs/validation.config');
const Group = require('../models/group.model');
const createError = require('http-errors');
const mongoose = require('mongoose');

module.exports = {
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

            const group = new Group({
                title,
                description,
                owner: new mongoose.Types.ObjectId(user.aud),
            });
            const savedGroup = await group.save();
            await savedGroup.addMember(user.aud);
            res.send(savedGroup);
        } catch (error) {
            if (error.errors) {
                const errors = Object.values(error.errors).map(
                    err => err.message
                );
                error = createError(422, { message: errors.join(', ') });
            }
            next(error);
        }
    },
};
