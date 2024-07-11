const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReactSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        photo: {
            type: Schema.Types.ObjectId,
            ref: 'photo',
            required: true,
        },
    },
    { timestamps: true }
);

ReactSchema.post('save', async function (doc, next) {
    try {
        await mongoose.model('photo').findByIdAndUpdate(doc.photo, {
            $addToSet: { react: doc._id },
        });
        await mongoose.model('user').findByIdAndUpdate(doc.user, {
            $addToSet: { reacts: doc._id },
        });
    } catch (error) {
        next(error);
    }
});

const React = mongoose.model('react', ReactSchema);
module.exports = React;
