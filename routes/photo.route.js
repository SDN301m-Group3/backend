const express = require('express');
const photoRouter = express.Router();
const { PhotoController } = require('../controllers');
const { JwtConfig } = require('../configs');
const paginationHandler = require('../middlewares/pagination.handler');

photoRouter.get(
    '/recent-view',
    JwtConfig.verifyAccessToken,
    PhotoController.recentViewPhotos
);

photoRouter.get(
    '/:id',
    JwtConfig.verifyAccessToken,
    PhotoController.getPhotoById
);

photoRouter.get(
    '/:id/comments',
    [JwtConfig.verifyAccessToken, paginationHandler],
    PhotoController.getCommentByPhotoId
);
photoRouter.post(
    '/:id/comment',
    JwtConfig.verifyAccessToken,
    PhotoController.createComment
);

photoRouter.post(
    '/:id/react',
    JwtConfig.verifyAccessToken,
    PhotoController.createReact
);

photoRouter.patch(
    '/:id',
    JwtConfig.verifyAccessToken,
    PhotoController.editPhoto
);

module.exports = photoRouter;
