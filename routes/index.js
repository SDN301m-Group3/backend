const express = require('express');
const createError = require('http-errors');

const AlbumRouter = require('./album.route');
const AuthRouter = require('./auth.route');
const GroupRouter = require('./group.route');
const UserRouter = require('./user.route');
const NotificationRouter = require('./notification.route');
const PhotoRouter = require('./photo.route');
const CommentRouter = require('./comment.route');
const { JwtConfig } = require('../configs');
const reactRouter = require('./react.route');
const router = express.Router();

router.get('/', JwtConfig.verifyAccessToken, async (req, res, next) => {
    res.send('Hello from express');
});

router.use('/auth', AuthRouter);
router.use('/groups', GroupRouter);
router.use('/albums', AlbumRouter);
router.use('/users', UserRouter);
router.use('/notifications', NotificationRouter);
router.use('/photos', PhotoRouter);
router.use('/reacts', reactRouter)

router.use((req, res, next) => {
    next(createError.NotFound());
})

module.exports = router;