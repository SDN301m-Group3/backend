const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const createError = require('http-errors');
const db = require('./models');
require('dotenv').config();

const {
    AuthRouter,
    GroupRouter,
    AlbumRouter,
    UserRouter,
    NotificationRouter,
    PhotoRouter,
    CommentRouter,
} = require('./routes');

const { JwtConfig } = require('./configs');

const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
}));

app.get('/', JwtConfig.verifyAccessToken, async (req, res, next) => {
    res.send('Hello from express');
});

app.use('/auth', AuthRouter);
app.use('/groups', GroupRouter);
app.use('/albums', AlbumRouter);
app.use('/users', UserRouter);
app.use('/notifications', NotificationRouter);
app.use('/photos', PhotoRouter);

app.use(async (req, res, next) => {
    next(createError.NotFound());
});

app.use((err, req, res, next) => {
  res.status(err.status || 400);
  res.send({
    error: {
      status: err.status || 400,
      message: err.message,
    },
  });
});

const PORT = process.env.PORT || 9999;
const HOST_NAME = process.env.HOST_NAME || 'localhost';

app.listen(PORT, HOST_NAME, () => {
    console.log(`Server is running at: http://${HOST_NAME}:${PORT}`);
    db.connectDb();
});
