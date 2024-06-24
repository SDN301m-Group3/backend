const User = require('../models/user.model');
const createError = require('http-errors');
const mongoose = require('mongoose');
const { editProfileFormSchema } = require('../configs/validation.config');

module.exports = {
    editProfile: async (req, res, next) => {
        try {
            const user = req.payload;
            const { username, fullName, phoneNumber, password, bio, img } =
                editProfileFormSchema.parse(req.body);
            await User.findByIdAndUpdate(user.aud, {
                username,
                fullName,
                phoneNumber,
                bio,
                img,
            }).then((user) => {
                if (!user) {
                    throw createError(404, 'User not found');
                } else {
                    user.username = username || user.username;
                    user.fullName = fullName || user.fullName;
                    user.phoneNumber = phoneNumber || user.phoneNumber;
                    user.bio = bio || user.bio;
                    user.img = img || user.img;
                    res.send(user);
                }
            });
        } catch (error) {
            next(error);
        }
    },

    getUserInfor: async (req, res, next) => {
        try {
            const user = req.payload;
            await User.findById(user.aud).then((user) => {
                if (!user) {
                    throw createError(404, 'User not found');
                } else {
                    res.send(user);
                }
            });
        } catch (error) {
            next(error);
        }
    },
};
