const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["USER", "GROUP", "ALBUM"],
  },
  //TO DO: Define the receiver field
  receivers: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: function () {
      return this.type.toLowerCase();
    },
  },
  content: {
    type: String,
    required: true,
    maxLength: [200, "Content must be at most 200 characters"],
  },
  seen: {
    type: Boolean,
    default: false,
  },
  redirectUrl: {
    type: String,
  },
});

const Notification = mongoose.model("notification", NotificationSchema);
module.exports = Notification;
