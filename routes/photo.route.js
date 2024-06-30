const express = require('express');
const photoRouter = express.Router();
const { PhotoController } = require('../controllers');
const { JwtConfig } = require('../configs');

photoRouter.get(
    '/:id',
    JwtConfig.verifyAccessToken,
    PhotoController.getPhotoById
);

photoRouter.get(
    '/:id/comments',
    JwtConfig.verifyAccessToken,
    PhotoController.getCommentByPhotoId
);

photoRouter.get(
    '/:id/reacts',
    JwtConfig.verifyAccessToken,
    PhotoController.getReactByPhotoId
);

photoRouter.post(
    '/:id/comments',
    JwtConfig.verifyAccessToken,
    PhotoController.addCommentToPhoto
);

photoRouter.post(
    '/:id/reacts',
    JwtConfig.verifyAccessToken,
    PhotoController.addReactToPhoto
);

module.exports = photoRouter;
