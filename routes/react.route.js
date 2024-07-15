const express = require('express');
const reactRouter = express.Router();
const { JwtConfig } = require('../configs');
const { ReactController } = require('../controllers');

reactRouter.get('/list/:photoId', JwtConfig.verifyAccessToken, ReactController.getReactListOfPhoto)

module.exports = reactRouter