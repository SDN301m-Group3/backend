const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const UserSchema = new Schema(
    {
        username: {
            type: String,
            required: [true, 'Username is required'],
            minLength: [6, 'Username must be at least 6 characters'],
            maxLength: [20, 'Username must be at most 20 characters'],
            unique: true,
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            validate: {
                validator: function (v) {
                    return /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(v);
                },
                message: (props) => `${props.value} is not a valid email!`,
            },
            unique: [true, 'Email already exists'],
        },
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
            minLength: [6, 'Full name must be at least 6 characters'],
            maxLength: [50, 'Full name must be at most 50 characters'],
        },
        status: {
            type: String,
            enum: ['NOT_ACTIVE', 'ACTIVE', 'BANNED', 'DELETED'],
            default: 'NOT_ACTIVE',
        },
        phoneNumber: {
            type: String,
            required: false,
            validate: {
                validator: function (v) {
                    return /^\d{10}$/.test(v);
                },
                message: (props) =>
                    `${props.value} is not a valid phone number!`,
            },
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
        },
        img: {
            type: String,
            required: false,
        },
        groups: [
            {
                type: Schema.Types.ObjectId,
                ref: 'group',
            },
        ],
        histories: [
            {
                type: Schema.Types.ObjectId,
                ref: 'history',
            },
        ],
        notifications: [
            {
                type: Schema.Types.ObjectId,
                ref: 'notification',
            },
        ],
        comments: [
            {
                type: Schema.Types.ObjectId,
                ref: 'comment',
            },
        ],
        reacts: [
            {
                type: Schema.Types.ObjectId,
                ref: 'react',
            },
        ],
        photos: [
            {
                type: Schema.Types.ObjectId,
                ref: 'photo',
            },
        ],
        bio: {
            type: String,
            required: false,
            maxLength: [200, 'Bio must be at most 200 characters'],
        },
    },
    { timestamps: true }
);

UserSchema.methods.isValidPassword = async function (password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (error) {
        throw error;
    }
};

UserSchema.methods.addGroup = function (groupId) {
    if (this.groups.includes(groupId)) {
        return this;
    }
    this.groups.push(groupId);
    return this.save();
};

UserSchema.methods.addHistory = function (historyId) {
    if (this.histories.includes(historyId)) {
        return this;
    }
    this.histories.push(historyId);
    return this.save();
};

UserSchema.methods.addNotification = function (notificationId) {
    if (this.notifications.includes(notificationId)) {
        return this;
    }
    this.notifications.push(notificationId);
    return this.save();
};

UserSchema.methods.removeGroup = function (groupId) {
    this.groups = this.groups.filter((group) => group.toString() !== groupId);
    return this.save();
};

UserSchema.methods.removeHistory = function (historyId) {
    this.histories = this.histories.filter(
        (history) => history.toString() !== historyId
    );
    return this.save();
};

UserSchema.methods.removeNotification = function (notificationId) {
    this.notifications = this.notifications.filter(
        (notification) => notification.toString() !== notificationId
    );
    return this.save();
};

UserSchema.methods.addComment = function (commentId) {
    if (this.comments.includes(commentId)) {
        return this;
    }
    this.comments.push(commentId);
    return this.save();
};

UserSchema.methods.removeComment = function (commentId) {
    this.comments = this.comments.filter(
        (comment) => comment.toString() !== commentId
    );
    return this.save();
};

UserSchema.methods.addReact = function (reactId) {
    if (this.reacts.includes(reactId)) {
        return this;
    }
    this.reacts.push(reactId);
    return this.save();
};

UserSchema.methods.removeReact = function (reactId) {
    this.reacts = this.reacts.filter((react) => react.toString() !== reactId);
    return this.save();
};

UserSchema.methods.addPhoto = function (photoId) {
    if (this.photos.includes(photoId)) {
        return this;
    }
    this.photos.push(photoId);
    return this.save();
};

UserSchema.methods.removePhoto = function (photoId) {
    this.photos = this.photos.filter((photo) => photo.toString() !== photoId);
    return this.save();
};

const User = mongoose.model('user', UserSchema);
module.exports = User;
