const express = require('express');
const groupRouter = express.Router();
const { GroupController } = require('../controllers');
const { JwtConfig } = require('../configs');

groupRouter.get(
    '/my-groups',
    JwtConfig.verifyAccessToken,
    GroupController.getMyGroups
);

groupRouter.get(
    '/all-groups',
    JwtConfig.verifyAccessToken,
    GroupController.getAllGroupsWithUser
);

groupRouter.post(
    '/create',
    JwtConfig.verifyAccessToken,
    GroupController.createGroup
);

groupRouter.get(
    '/:groupId/albums',
    JwtConfig.verifyAccessToken,
    GroupController.getAlbumsByGroupId
);

groupRouter.get(
    '/:groupId/members',
    JwtConfig.verifyAccessToken,
    GroupController.getMembersByGroupId
);

groupRouter.get(
    '/:groupId',
    JwtConfig.verifyAccessToken,
    GroupController.getGroupById
);

groupRouter.post(
    '/:groupId/create-album',
    JwtConfig.verifyAccessToken,
    GroupController.createAlbum
);

groupRouter.post(
    '/join',
    JwtConfig.verifyAccessToken,
    GroupController.joinGroup
);

module.exports = groupRouter;
