const JWT = require('jsonwebtoken');
const createError = require('http-errors');
const client = require('./redis.config');
const os = require('os');

module.exports = {
    signAccessToken: (user) => {
        return new Promise((resolve, reject) => {
            const payload = {
                email: user.email,
                username: user.username,
                fullName: user.fullName,
                img: user.img,
            };
            const secret = process.env.ACCESS_TOKEN_SECRET;
            const options = {
                expiresIn: '5h',
                issuer: process.env.ISSUER,
                audience: user.id,
            };
            JWT.sign(payload, secret, options, (err, token) => {
                if (err) {
                    console.log(err.message);
                    return reject(createError.InternalServerError());
                }
                resolve(token);
            });
        });
    },
    verifyAccessToken: (req, res, next) => {
        if (!req.headers['authorization'])
            return next(createError.Unauthorized());
        const authHeader = req.headers['authorization'];
        const bearerToken = authHeader.split(' ');
        const token = bearerToken[1];
        JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
            if (err) {
                const message =
                    err.name === 'JsonWebTokenError'
                        ? 'Unauthorized'
                        : err.message;
                return next(createError.Unauthorized(message));
            }
            req.payload = payload;
            next();
        });
    },
    signRefreshToken: (userId) => {
        return new Promise((resolve, reject) => {
            const payload = {};
            const secret = process.env.REFRESH_TOKEN_SECRET;
            const options = {
                expiresIn: '7d',
                issuer: process.env.ISSUER,
                audience: userId,
            };
            JWT.sign(payload, secret, options, async (err, token) => {
                if (err) {
                    console.log(err.message);
                    return reject(createError.InternalServerError());
                }

                // Save the refresh token in Redis, expire in 1 year
                await client.set(
                    `refreshToken-${os.hostname()}-${os.platform()}-${userId}`,
                    token,
                    'EX',
                    365 * 24 * 60 * 60
                );
                resolve(token);
            });
        });
    },
    verifyRefreshToken: (refreshToken) => {
        return new Promise((resolve, reject) => {
            JWT.verify(
                refreshToken,
                process.env.REFRESH_TOKEN_SECRET,
                async (err, payload) => {
                    if (err) return reject(createError.Unauthorized());
                    const userId = payload.aud;
                    const result = await client.get(
                        `refreshToken-${os.hostname()}-${os.platform()}-${userId}`
                    );
                    if (refreshToken === result) return resolve(userId);
                    reject(createError.Unauthorized());
                }
            );
        });
    },
};
