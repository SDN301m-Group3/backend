const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema(
    {
        photo: {
            type: Schema.Types.ObjectId,
            ref: 'photo',
            required: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        content: {
            type: String,
            required: true,
            maxLength: [200, 'Content must be at most 200 characters'],
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'INACTIVE', 'DELETED'],
            default: 'ACTIVE',
        },
    },
    { timestamps: true }
);

CommentSchema.post('save', async function (doc, next) {
    try {
        await mongoose.model('photo').findByIdAndUpdate(doc.photo, {
            $addToSet: { comments: doc._id },
        });
        await mongoose.model('user').findByIdAndUpdate(doc.user, {
            $addToSet: { comments: doc._id },
        });
    } catch (error) {
        next(error);
    }
});

const Comment = mongoose.model('comment', CommentSchema);
module.exports = Comment;
