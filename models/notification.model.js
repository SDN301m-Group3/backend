const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: ['USER', 'GROUP', 'ALBUM'],
        },
        //TO DO: Define the receiver field
        receivers: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: function () {
                return this.type.toLowerCase();
            },
        },
        content: {
            type: String,
            required: true,
            maxLength: [200, 'Content must be at most 200 characters'],
        },
        seen: [
            {
                type: Schema.Types.ObjectId,
                ref: 'user',
            },
        ],
        redirectUrl: {
            type: String,
        },
    },
    { timestamps: true }
);

NotificationSchema.methods.markAsSeen = function (userId) {
    if (this.seen.includes(userId)) {
        return this;
    }
    this.seen.push(userId);
    return this.save();
};

NotificationSchema.post('save', async function (doc, next) {
    try {
        const type = doc.type.toLowerCase();
        if (type === 'user') {
            await mongoose.model('user').findByIdAndUpdate(doc.receivers, {
                $addToSet: { notifications: doc._id },
            });
        } else {
            const members = await mongoose
                .model(type)
                .findById(doc.receivers)
                .select('members')
                .ne('members', doc.user);

            for (const member of members) {
                await mongoose.model('user').findByIdAndUpdate(member, {
                    $addToSet: { notifications: doc._id },
                });
            }
        }
    } catch (error) {
        next(error);
    }
});

const Notification = mongoose.model('notification', NotificationSchema);
module.exports = Notification;
