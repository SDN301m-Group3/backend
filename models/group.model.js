const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GroupSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'user',
            required: true,
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
        groupImg: {
            type: String,
            require: false,
        },
        groupCode: {
            type: String,
            required: [true, 'Group code is required'],
            unique: [true, 'Group code must be unique'],
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

GroupSchema.methods.removeMember = function (userId) {
    this.members = this.members.filter(
        (member) => member.toString() !== userId.toString()
    );
    return this.save();
};

GroupSchema.methods.removeAlbum = function (albumId) {
    this.albums = this.albums.filter(
        (album) => album.toString() !== albumId.toString()
    );
    return this.save();
};

const Group = mongoose.model('group', GroupSchema);
module.exports = Group;
