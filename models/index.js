const mongoose = require("mongoose");

const User = require("./user.model");
const Group = require("./group.model");
const Album = require("./album.model");
const Photo = require("./photo.model");
const History = require("./history.model");
const Notification = require("./notification.model");
const Comment = require("./comment.model");
const React = require("./react.model");

mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.user = User;
db.group = Group;
db.album = Album;
db.photo = Photo;
db.history = History;
db.notification = Notification;
db.comment = Comment;
db.react = React;

db.connectDb = async () => {
  await mongoose
    .connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME,
    })
    .then(() => {
      console.log("MongoDB connected");
    })
    .catch((error) => {
      console.error("MongoDB connection error: ", error.message);
      process.exit(1);
    });
};

module.exports = db;
