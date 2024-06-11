const express = require('express');
const authRouter = express.Router();

const { AuthController } = require('../controllers');

authRouter.post('/register', AuthController.register);

authRouter.post('/login', AuthController.login);

authRouter.post('/refresh-token', AuthController.refreshToken);

authRouter.delete('/logout', AuthController.logout);

authRouter.delete('/logout-all', AuthController.logoutAll);

authRouter.get('/activate/:token', AuthController.activate);

module.exports = authRouter;
