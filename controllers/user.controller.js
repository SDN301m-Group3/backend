const createError = require('http-errors');
const db = require('../models');
const User = db.user;

module.exports = {
    getUsers: async (req, res, next) => {
        try {
            const { search = '', limit = 5 } = req.query;

            const parsedLimit = parseInt(limit);
            if (isNaN(parsedLimit)) {
                throw createError.BadRequest('Invalid limit');
            }
            const users = await User.find(
                {
                    $or: [
                        { username: { $regex: search, $options: 'i' } },
                        { email: { $regex: search, $options: 'i' } },
                    ],
                    status: 'ACTIVE',
                },
                {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    email: 1,
                    img: 1,
                }
            ).limit(parsedLimit);
            res.status(200).json(users);
        } catch (error) {
            next(error);
        }
    },
};
