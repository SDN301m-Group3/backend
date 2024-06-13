const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReactSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    photo: {
      type: Schema.Types.ObjectId,
      ref: "photo",
      required: true,
    },
  },
  { timestamps: true }
);

const React = mongoose.model("react", ReactSchema);
module.exports = React;
