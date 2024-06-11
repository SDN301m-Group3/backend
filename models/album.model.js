const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AlbumSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: false,
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'INACTIVE', 'DELETED'],
            default: 'ACTIVE',
        },
        photos: [
            {
                type: Schema.Types.ObjectId,
                ref: 'photo',
            },
        ],
        group: {
            type: Schema.Types.ObjectId,
            ref: 'group',
        },
    },
    { timestamps: true }
);

const Album = mongoose.model('album', AlbumSchema);
module.exports = Album;
