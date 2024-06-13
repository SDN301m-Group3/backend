const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PhotoSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: false,
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
        album: [
            {
                type: Schema.Types.ObjectId,
                ref: 'album',
            },
        ],
    },
    { timestamps: true }
);

const Photo = mongoose.model('photo', PhotoSchema);
module.exports = Photo;
