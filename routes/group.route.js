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
)

groupRouter.post(
    '/create',
    JwtConfig.verifyAccessToken,
    GroupController.createGroup
);

module.exports = groupRouter;
