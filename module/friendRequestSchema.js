const mongoose = require('mongoose')
const { isEmail } = require("validator")

const FriendRequestSchema = new mongoose.Schema({
    ByUserID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    ToUserID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    status: {
        type: String,
        default: "pending",
        enum: ["accepted", "rejected", "pending"]
    },
    requestRecivedAt: {
        type: Date,
        default: Date.now,
    }
})

module.exports = mongoose.model('FriendRequest', FriendRequestSchema)