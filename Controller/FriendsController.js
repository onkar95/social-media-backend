const User = require('../module/userSchema');
const friendRequestSchema = require('../module/friendRequestSchema');
const { validationResult } = require('express-validator');

//send friend request
exports.sendFriendRequest = async (req, res) => {
    const session = req.session;
    try {
        const { id: byUserId } = req.params
        const { ToUserID: toUserId } = req.body;

        //express validator
        const err = validationResult(req)
        if (!err.isEmpty()) {
            return res.status(400).json({ errors: err.array() })
        }

        // Check if both the sending and receiving user exist
        const byUser = await User.findById(byUserId);
        if (!byUser) return res.status(400).json({ error: "Sending user not found" });

        const toUser = await User.findById(toUserId);
        if (!toUser) return res.status(400).json({ error: "Receiving user not found" });

        // Check if the previous request is still pending
        const pendingRequest = await friendRequestSchema.findOne({
            ByUserID: byUserId,
            ToUserID: toUserId,
            status: "pending",
        });
        if (pendingRequest) return res.status(400).json({ error: "Friend request already pending" });

        // Check if both users are already friends
        const alreadyFriends = byUser.friendList.some(friend => friend.friendID.equals(toUserId));
        if (alreadyFriends) return res.status(400).json({ error: "Users are already friends" });

        // Create the friend request
        const friendRequest = new friendRequestSchema({
            ByUserID: byUserId,
            ToUserID: toUserId,
        });


        const savedFriendRequest = await friendRequest.save();

        // Add the friend request to the sending user's friend requests
        byUser.friendRequests.push(savedFriendRequest._id);
        toUser.friendRequests.push(savedFriendRequest._id);
        await byUser.save();

        // Commit the transaction
        await session.commitTransaction();
        res.status(201).json({ message: "Friend request sent successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
        await session.abortTransaction();
    } finally {
        if (session) {
            req.session.endSession() || session.endSession();
        }
    }

}

// get your requests
exports.getMyFriendRequest = async (req, res) => {
    const session = req.session;
    try {
        const { id } = req.params
        //express validator
        const err = validationResult(req)
        if (!err.isEmpty()) {
            return res.status(400).json({ errors: err.array() })
        }
        var populateQuery = [
            { path: "ByUserID", module: "Users", select: "name email" }
        ];

        const getRequests = await friendRequestSchema
            .find({ ToUserID: id })
            .populate(populateQuery)
            .select("ByUserID status requestRecivedAt")

        // Commit the transaction
        await session.commitTransaction();

        // console.log(getRequests)
        res.status(200).json({ getRequests })

    } catch (error) {
        console.log(error?.stack)
        res.status(500).json({ error: error.message })
        await session.abortTransaction();
    } finally {
        if (session) {
            req.session.endSession() || session.endSession();
        }
    }
}

exports.getAllFriendRequest = async (req, res) => {
    const session = req.session;
    try {
        const { id } = req.params
        //express validator
        const err = validationResult(req)
        if (!err.isEmpty()) {
            return res.status(400).json({ errors: err.array() })
        }
        var populateQuery = [
            { path: "ToUserID", module: "Users" },
            { path: "ByUserID", module: "Users" }
        ];
        const getRequests = await friendRequestSchema.find()
        // console.log(getRequests)
        await session.commitTransaction();
        res.status(200).json({ getRequests })

    } catch (error) {
        console.log(error?.stack)
        res.status(200).json({ error: error.message })
        await session.abortTransaction();
    } finally {
        if (session) {
            req.session.endSession() || session.endSession();
        }
    }
}

// handeling request by request id and updatefriendlist
exports.handelRequestById = async (req, res, next) => {
    const session = req.session;
    const { status } = req.body;
    const { id } = req.params;
    //express validator
    const err = validationResult(req)
    if (!err.isEmpty()) {
        return res.status(400).json({ errors: err.array() })
    }
    try {
        const friendRequest = await friendRequestSchema.findById(id);

        if (!friendRequest) {
            return res.status(404).json({
                success: false,
                error: "Friend request not found",
            });
        }
        friendRequest.status = status;
        await friendRequest.save();
        if (status === "accepted") {
            const ByUser = await User.findById(friendRequest.ByUserID);
            const ToUser = await User.findById(friendRequest.ToUserID);
            ByUser.friendList.push({ friendID: ToUser._id });
            ToUser.friendList.push({ friendID: ByUser._id });
            await ByUser.save();
            await ToUser.save();
        }
        await friendRequest.remove();

        // Commit the transaction
        await session.commitTransaction();

        res.status(200).json({
            success: true,
            data: friendRequest,
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message,
        });
        await session.abortTransaction();
    } finally {
        if (session) {
            req.session.endSession() || session.endSession();
        }
    }
}

// get friend list
exports.getMyFriends = async (req, res) => {
    const session = req.session;
    try {
        const { id } = req.params
        //express validator
        const err = validationResult(req)
        if (!err.isEmpty()) {
            return res.status(400).json({ errors: err.array() })
        }
        const seemyfriends = await User.findById(id)
            .populate("friendList.friendID", ["name", "email"])
            .select("friendList")

        res.status(200).json({ seemyfriends })

    } catch (error) {
        res.status(400).json({ error: error.message })
        await session.abortTransaction();
    } finally {
        if (session) {
            req.session.endSession() || session.endSession();
        }
    }
}

//delete or reject request
exports.deleteRequest = async (req, res) => {
    const session = req.session;
    try {
        const { id } = req.params
        //express validator
        const err = validationResult(req)
        if (!err.isEmpty()) {
            return res.status(400).json({ errors: err.array() })
        }

        const checkReq = await friendRequestSchema.findById(id)
        if (checkReq) {
            const deleteRequest = await friendRequestSchema.findByIdAndDelete(id)
            // Commit the transaction
            await session.commitTransaction();
            return res.status(200).json({ deleteRequest })
        }
        res.status(400).json({ error: "no request found" })

    } catch (error) {
        res.status(400).json({ error: error.message })
        await session.abortTransaction();
    } finally {
        if (session) {
            req.session.endSession() || session.endSession();
        }
    }
}


