const mongoose = require('mongoose')
const { isEmail } = require("validator")

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter a name"],
    },
    email: {
        type: String,
        required: [true, "please enter Email"],
        unique: true,
        lowercase: true,
        validate: [isEmail, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: [true, "please enter a password"],
        minlength: [8, "password should be at least 8 character long"]
    },
    friendRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "FriendRequest"
    }],
    friendList: [
        {
            friendID: {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
                required: true,
            },
            firendAddedAt: {
                type: Date,
                default: Date.now,
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    }
})

module.exports = mongoose.model('User', userSchema)