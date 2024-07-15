const db = require('../models');
const Album = db.album;

module.exports = {
    isAlbumMember: async (req, res, next) => {
        try {
            const user = req.payload;
            const { albumId } = req.params;
            const album = await Album.findOne({
                _id: albumId,
                members: { $in: [user.aud] },
                status: 'ACTIVE',
            });
            if (!album) {
                throw createError(404, 'Album not found');
            }

            req.album = album;
            next();
        } catch (error) {
            next(error);
        }
    },
};
