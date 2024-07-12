const createError = require('http-errors');
const User = require('../models/user.model');
const { ValidationConfig } = require('../configs');
const { JwtConfig } = require('../configs');
const MailerService = require('../services/mailer.service');
const bcrypt = require('bcrypt');
const os = require('os');
const { selector } = require('../utils');
const client = require('../configs/redis.config');

module.exports = {
    register: async (req, res, next) => {
        try {
            const { fullName, username, email, phoneNumber, password } =
                ValidationConfig.registerSchema.parse(req.body);

            const isUsernameExist = await User.findOne({ username });
            if (isUsernameExist) {
                throw createError.Conflict(
                    `${username} is already been registered`
                );
            }

            const isEmailExist = await User.findOne({ email });
            if (isEmailExist) {
                throw createError.Conflict(
                    `${email} is already been registered`
                );
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const user = new User({
                fullName,
                username,
                phoneNumber,
                email,
                password: hashedPassword,
            });
            const savedUser = await user.save();

            await MailerService.sendActivationEmail(savedUser);

            const userObject = selector(savedUser.toObject(), [
                'fullName',
                'username',
                'phoneNumber',
                'email',
                'status',
            ]);
            res.send(userObject);
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
    login: async (req, res, next) => {
        try {
            const { email, password } = ValidationConfig.loginSchema.parse(
                req.body
            );
            const user = await User.findOne({ email });
            if (!user) {
                throw createError.NotFound('User not registered');
            }
            const isMatch = await user.isValidPassword(password);
            if (!isMatch) {
                throw createError.Unauthorized('Username/password not valid');
            }

            if (user.status === 'NOT_ACTIVE')
                throw createError.Unauthorized('User not activated');
            if (user.status === 'BANNED')
                throw createError.Unauthorized('User is banned');
            if (user.status === 'DELETED')
                throw createError.Unauthorized('User is deleted');

            const accessToken = await JwtConfig.signAccessToken(user);
            const refreshToken = await JwtConfig.signRefreshToken(user.id);

            res.send({ accessToken, refreshToken });
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
    refreshToken: async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) throw createError.BadRequest();
            const userId = await JwtConfig.verifyRefreshToken(refreshToken);

            const user = await User.findById(userId);

            const accessToken = await JwtConfig.signAccessToken(user);
            const refToken = await JwtConfig.signRefreshToken(userId);

            res.send({ accessToken: accessToken, refreshToken: refToken });
        } catch (error) {
            next(error);
        }
    },
    logout: async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) throw createError.BadRequest();
            const userId = await JwtConfig.verifyRefreshToken(refreshToken);

            await client.del(
                `refreshToken-${os.hostname()}-${os.platform()}-${userId}`
            );
            res.sendStatus(204);
        } catch (error) {
            next(error);
        }
    },
    logoutAll: async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) throw createError.BadRequest();
            const userId = await JwtConfig.verifyRefreshToken(refreshToken);

            const keys = await client.keys(`refreshToken-*-${userId}`);
            keys.forEach(async (key) => {
                await client.del(key);
            });
            res.sendStatus(204);
        } catch (error) {
            next(error);
        }
    },
    activate: async (req, res, next) => {
        try {
            const { token } = req.params;
            const { active } = req.query;

            if (!token) throw createError.BadRequest('Invalid user token');

            const userId = await client.get(`emailActivationToken-${token}`);
            if (!userId) throw createError.BadRequest('Invalid user token');

            const user = await User.findById(userId);
            if (!user) throw createError.BadRequest('Invalid user token');

            if (active === 'EMAIL_VERIFY') {
                user.status = 'ACTIVE';
                await user.save();
                await client.del(`emailActivationToken-${token}`);
            }

            res.send({ message: 'Account activated successfully' });
        } catch (error) {
            next(error);
        }
    },
};
