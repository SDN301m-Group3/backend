const express = require('express');
const albumRouter = express.Router();
const { AlbumController } = require('../controllers');
const { JwtConfig } = require('../configs');
const imageUploadHandler = require('../middlewares/uploadImage.handler');
const paginationHandler = require('../middlewares/pagination.handler');
const AlbumHandler = require('../middlewares/album.handler');

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
    [
        JwtConfig.verifyAccessToken,
        AlbumHandler.isAlbumMember,
        paginationHandler,
    ],
    AlbumController.getPhotosByAlbumId
);

albumRouter.get(
    '/:albumId',
    JwtConfig.verifyAccessToken,
    AlbumController.getAlbumById
);

albumRouter.post(
    '/:albumId',
    JwtConfig.verifyAccessToken,
    AlbumController.updateAlbumById
);

albumRouter.get(
    '/:albumId/add-random-photos',
    JwtConfig.verifyAccessToken,
    AlbumController.createRandomPhotos
);

albumRouter.post(
    '/:albumId/upload-photo',
    [
        JwtConfig.verifyAccessToken,
        AlbumHandler.isAlbumMember,
        imageUploadHandler.single('image'),
    ],
    AlbumController.uploadPhotoToAlbum
);

albumRouter.post(
    '/:albumId/invite',
    [JwtConfig.verifyAccessToken, AlbumHandler.isAlbumMember],
    AlbumController.inviteUserToAlbum
);

albumRouter.post(
    '/:albumId/accept-invite',
    JwtConfig.verifyAccessToken,
    AlbumController.acceptInvitationToAlbum
);

albumRouter.post(
    '/:albumId/share',
    [JwtConfig.verifyAccessToken, AlbumHandler.isAlbumMember],
    AlbumController.shareAlbum
);

albumRouter.get(
    '/:albumId/photos/share',
    paginationHandler,
    AlbumController.getPhotosByShareAlbum
);

albumRouter.delete(
    '/:albumId/photos/:photoId',
    JwtConfig.verifyAccessToken,
    AlbumController.removePhotoFromAlbum
);

module.exports = albumRouter;
