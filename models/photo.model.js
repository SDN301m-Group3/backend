const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PhotoSchema = new Schema(
    {
        album: [
            {
                type: Schema.Types.ObjectId,
                ref: 'album',
            },
        ],
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'INACTIVE', 'DELETED'],
            default: 'ACTIVE',
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxLength: [50, 'Title must be at most 50 characters'],
        },
        url: {
            type: String,
            required: true,
        },
        comments: [
            {
                type: Schema.Types.ObjectId,
                ref: 'comment',
            },
        ],
        tags: [
            {
                type: String,
            },
        ],
        react: [
            {
                type: Schema.Types.ObjectId,
                ref: 'react',
            },
        ],
    },
    { timestamps: true }
);

PhotoSchema.methods.addAlbum = function (albumId) {
    if (this.album.includes(albumId)) {
        return this;
    }
    this.album.push(albumId);
    return this.save();
};

PhotoSchema.methods.addComment = function (commentId) {
    if (this.comments.includes(commentId)) {
        return this;
    }
    this.comments.push(commentId);
    return this.save();
};

PhotoSchema.methods.addReact = function (reactId) {
    if (this.react.includes(reactId)) {
        return this;
    }
    this.react.push(reactId);
    return this.save();
};

PhotoSchema.methods.removeComment = function (commentId) {
    this.comments = this.comments.filter(
        (comment) => comment.toString() !== commentId.toString()
    );
    return this.save();
};

PhotoSchema.methods.removeAlbum = function (albumId) {
    this.album = this.album.filter(
        (album) => album.toString() !== albumId.toString()
    );
    return this.save();
};

PhotoSchema.methods.removeReact = function (reactId) {
    this.react = this.react.filter(
        (react) => react.toString() !== reactId.toString()
    );
    return this.save();
};

const Photo = mongoose.model('photo', PhotoSchema);
module.exports = Photo;
