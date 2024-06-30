const express = require('express');
const commentRouter = express.Router();
const { CommentController } = require('../controllers');
const { JwtConfig } = require('../configs');

module.exports = commentRouter;
