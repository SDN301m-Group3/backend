const express = require('express');
const userRouter = express.Router();
const { UserController } = require('../controllers');
const { JwtConfig } = require('../configs');

userRouter.put(
    '/edit-profile',
    JwtConfig.verifyAccessToken,
    UserController.editProfile
);

userRouter.get(
    '/user-info',
    JwtConfig.verifyAccessToken,
    UserController.getUserInfor
);
module.exports = userRouter;
