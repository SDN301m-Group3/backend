const express = require('express');
const userRouter = express.Router();
const { UserController } = require('../controllers');
const { JwtConfig } = require('../configs');

userRouter.get('/', JwtConfig.verifyAccessToken, UserController.getUsers);

module.exports = userRouter;
