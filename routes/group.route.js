const express = require('express');
const groupRouter = express.Router();
const { GroupController } = require('../controllers');
const { JwtConfig } = require('../configs');
const imageUploadHandler = require('../middlewares/uploadImage.handler');

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

groupRouter.put(
    '/:groupId/remove',
    JwtConfig.verifyAccessToken,
    GroupController.removeGroup
);

groupRouter.post(
    '/:groupId/invite',
    JwtConfig.verifyAccessToken,
    GroupController.inviteUserToGroup
);

groupRouter.post(
    '/:groupId/accept-invite',
    JwtConfig.verifyAccessToken,
    GroupController.acceptInvitationToGroup
);

// remove user from group
groupRouter.put(
    '/:groupId/remove-user/:userId',
    JwtConfig.verifyAccessToken,
    GroupController.removeUserFromGroup
);

//modify group
groupRouter.put(
    '/:groupId/modify',
    [JwtConfig.verifyAccessToken,imageUploadHandler.single('groupImg')],
    GroupController.modifyGroup
);

//out group
groupRouter.put(
    '/:groupId/out-group',
    JwtConfig.verifyAccessToken,
    GroupController.outGroup
);

module.exports = groupRouter;
