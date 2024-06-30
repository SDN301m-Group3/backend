const AlbumRouter = require('./album.route');
const AuthRouter = require('./auth.route');
const GroupRouter = require('./group.route');
const UserRouter = require('./user.route');
const NotificationRouter = require('./notification.route');
const PhotoRouter = require('./photo.route');
const CommentRouter = require('./comment.route');

module.exports = {
    AuthRouter,
    GroupRouter,
    AlbumRouter,
    UserRouter,
    NotificationRouter,
    PhotoRouter,
    CommentRouter,
};
