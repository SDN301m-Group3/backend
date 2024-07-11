const express = require('express');
const albumRouter = express.Router();
const { AlbumController } = require('../controllers');
const { JwtConfig } = require('../configs');
const imageUploadHandler = require('../middlewares/uploadImage.handler');

albumRouter.put(
    '/delete/:id',
    JwtConfig.verifyAccessToken,
    AlbumController.removeAlbum
);

albumRouter.get(
    '/:albumId/members',
    JwtConfig.verifyAccessToken,
    AlbumController.getMembersByAlbumId
);

albumRouter.get(
    '/:albumId/photos',
    JwtConfig.verifyAccessToken,
    AlbumController.getPhotosByAlbumId
);

albumRouter.get(
    '/:albumId',
    JwtConfig.verifyAccessToken,
    AlbumController.getAlbumById
);

albumRouter.get(
    '/:albumId/add-random-photos',
    JwtConfig.verifyAccessToken,
    AlbumController.createRandomPhotos
);

albumRouter.post(
    '/:albumId/upload-photo',
    [JwtConfig.verifyAccessToken, imageUploadHandler.single('image')],
    AlbumController.uploadPhotoToAlbum
);

albumRouter.post(
    '/:albumId/invite',
    JwtConfig.verifyAccessToken,
    AlbumController.inviteUserToAlbum
);

albumRouter.post(
    '/:albumId/accept-invite',
    JwtConfig.verifyAccessToken,
    AlbumController.acceptInvitationToAlbum
);

albumRouter.put(
    '/:albumId/modify',
    JwtConfig.verifyAccessToken,
    AlbumController.modifyAlbum
);

module.exports = albumRouter;
