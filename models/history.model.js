const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HistorySchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        actionType: {
            type: String,
            required: true,
            enum: ['CREATE', 'UPDATE', 'DELETE', 'VIEW'],
        },
        photo: {
            type: Schema.Types.ObjectId,
            ref: 'photo',
            required: true,
        },
    },
    { timestamps: true }
);

const History = mongoose.model('history', HistorySchema);
module.exports = History;
