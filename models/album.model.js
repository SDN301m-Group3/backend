const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AlbumSchema = new Schema(
    {
        group: {
            type: Schema.Types.ObjectId,
            ref: 'group',
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'user',
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxLength: [50, 'Title must be at most 50 characters'],
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
        members: [
            {
                type: Schema.Types.ObjectId,
                ref: 'user',
            },
        ],
    },
    { timestamps: true }
);

AlbumSchema.methods.addPhoto = function (photoId) {
    if (this.photos.includes(photoId)) {
        return this;
    }
    this.photos.push(photoId);
    return this.save();
};

AlbumSchema.methods.addMember = function (userId) {
    if (this.members.includes(userId)) {
        return this;
    }
    this.members.push(userId);
    return this.save();
};

AlbumSchema.methods.removePhoto = function (photoId) {
    this.photos = this.photos.filter(
        (photo) => photo.toString() !== photoId.toString()
    );
    return this.save();
};

AlbumSchema.methods.removeMember = function (userId) {
    this.members = this.members.filter(
        (member) => member.toString() !== userId.toString()
    );
    return this.save();
};

const Album = mongoose.model('album', AlbumSchema);
module.exports = Album;
