const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GroupSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'user',
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
        albums: [
            {
                type: Schema.Types.ObjectId,
                ref: 'album',
            },
        ],
        members: [
            {
                type: Schema.Types.ObjectId,
                ref: 'user',
            },
        ],
    },
    { timestamps: true }
);

GroupSchema.methods.addAlbum = function (albumId) {
    this.albums.push(albumId);
    return this.save();
};

GroupSchema.methods.addMember = function (userId) {
    this.members.push(userId);
    return this.save();
};

const Group = mongoose.model('group', GroupSchema);
module.exports = Group;
