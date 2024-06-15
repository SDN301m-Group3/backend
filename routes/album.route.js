const express = require('express');
const albumRouter = express.Router();
const { AlbumController } = require('../controllers');
const { JwtConfig } = require('../configs');

// albumRouter.post(
//     '/:groupId/create-album',
//     JwtConfig.verifyAccessToken,
//     AlbumController.createAlbum
// );

albumRouter.put(
    '/delete/:id',
    JwtConfig.verifyAccessToken,
    AlbumController.removeAlbum
);

albumRouter.get(
    '/:albumId',
    JwtConfig.verifyAccessToken,
    AlbumController.getAlbumById
);

module.exports = albumRouter;
