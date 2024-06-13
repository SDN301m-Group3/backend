const { createAlbumFormSchema } = require("../configs/validation.config");
const Album = require("../models/album.model");
const createError = require("http-errors");
const mongoose = require("mongoose");

module.exports = {
  createAlbum: async (req, res, next) => {
    try {
      const user = req.payload;
      const { title, description } = createAlbumFormSchema.parse(req.body);
      const album = new Album({
        title,
        description,
        owner: new mongoose.Types.ObjectId(user.aud),
      });
      const savedAlbum = await album.save();
      await savedAlbum.addMember(user.aud);
      res.send(savedAlbum);
    } catch (error) {
      if (error.errors) {
        const errors = Object.values(error.errors).map((err) => err.message);
        error = createError(422, { message: errors.join(", ") });
      }
      next(error);
    }
  },

  // removeAlbum: async (req, res, next) => {
  //   try {
  //     const id = req.params.id;
  //     const user = req.payload;
  //     const album = await Album.findByIdAndUpdate(
  //       id,
  //       { owner: user.aud },
  //       { new: false }
  //     ).then((album) => {
  //       if (!album) {
  //         throw createError(404, "Album not found");
  //       } else {
  //         //status to deleted
  //         album.status = "DELETED";
  //         res.send(album);
  //       }
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // },
};
