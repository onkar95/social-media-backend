const User = require('../module/userSchema');
const friendRequestSchema = require('../module/friendRequestSchema');


exports.sendFriendRequest = async (req, res) => {
    try {
        const { id } = req.params
        const { ToUserID } = req.body

        var populateQuery = [
            { path: "ToUserID", module: "Users" },
            { path: "ByUserID", module: "Users" }
        ];

        //check for request either by user or to user 
        // .findOne({
        //     $or: [
        //         { $and: [{ ToUserID: ToUserID }, { ByUserID: id }] },
        //         { $and: [{ ToUserID: id }, { ByUserID: ToUserID }] }
        //     ]
        // })

        const checkIfRequestExist = await friendRequestSchema
            .findOne({ ToUserID: ToUserID }, { ByUserID: id })
            .populate(populateQuery)
            .select("status")

        if (checkIfRequestExist === null) {
            const createRequest = await friendRequestSchema.create({
                ToUserID,
                ByUserID: id,
            })
            res.status(200).json({ createRequest })


        } else {
            return res.status(403).json({ error: `request is ${checkIfRequestExist?.status} can not send new request` })
        }


    } catch (error) {

        res.status(200).json({ error: error.message })
    }
}

exports.getMyFriendRequest = async (req, res) => {
    try {
        const { id } = req.params

        var populateQuery = [
            { path: "ByUserID", module: "Users", select: "name email" }
        ];
        const getRequests = await friendRequestSchema
            .find({ ToUserID: id })
            .populate(populateQuery)
            .select("ByUserID status requestRecivedAt")
        // console.log(getRequests)
        res.status(200).json({ getRequests })

    } catch (error) {
        console.log(error?.stack)
        res.status(200).json({ error: error.message })
    }
}
exports.getAllFriendRequest = async (req, res) => {
    try {
        const { id } = req.params

        var populateQuery = [
            { path: "ToUserID", module: "Users" },
            { path: "ByUserID", module: "Users" }
        ];
        const getRequests = await friendRequestSchema.find().populate(populateQuery)
        // console.log(getRequests)
        res.status(200).json({ getRequests })

    } catch (error) {
        console.log(error?.stack)
        res.status(200).json({ error: error.message })
    }
}


// handeling request by sender and recivers id
exports.handelMyFriendRequest = async (req, res) => {
    try {
        const { id } = req.params
        const { ByUserID: idu, status } = req.body

        var populateQuery = [
            { path: "ToUserID", module: "Users" },
            { path: "ByUserID", module: "Users" }
        ];

        const myreq = await friendRequestSchema
            .findOne({ ToUserID: id }, { ByUserID: idu })
            .populate(populateQuery)
            .select("status")



        if (!myreq) {
            return res.status(200).json({ error: "no request found" })
        }
        if (myreq.status === "accepted") {
            return res.status(400).json({ error: "friend request is already accepted" })
        }

        const acceptRecquest = await friendRequestSchema.findByIdAndUpdate(
            myreq?._id,
            {
                status: status
            }, {
            runValidators: false,
            new: true
        })

        // add user to recivers friendlist ---> means the user(A) who recives the request will add the user(B) who sent the request into his(A) friendlist
        const requestRecivedTo = await User.findById(myreq.ToUserID).populate("firendList.friendID", ["name", "email"]);
        // checking for duplicate
        const checkforReciver = User.friendList.findIndex(friend => friend.friendID._id.toString() === friend.toString());
        if (checkforReciver === -1) {

            requestRecivedTo.firendList.push({
                friendID: myreq.ByUserID._id,
                friendAddedAt: Date.now()
            })
            await requestRecivedTo.save();
        }

        // add user to sender friendlist---> means the user(B) who had sent the request will add the user(A ) into his(B) friendlist 
        const requestSentBy = await User.findById(myreq.ByUserID).populate("firendList.friendID", ["name", "email"]);
        const checkforSender = User.friendList.findIndex(friend => friend.friendID.toString() === friend.toString());
        if (checkforSender === -1) {
            requestSentBy.firendList.push({
                friendID: myreq.ToUserID._id
            })
            await requestSentBy.save();
        }
        requestSentBy.firendList.push({
            friendID: myreq.ToUserID._id,
            friendAddedAt: Date.now()
        })
        await requestSentBy.save();

        //response for request accepted
        res.status(200).json({ message: "request accepted", acceptRecquest })

    } catch (error) {
        console.log("er", error)
        res.status(200).json({ error: error.message })
    }
}

// handeling request by request id 
exports.handelRequestById = async (req, res) => {
    try {
        const { id } = req.params
        const { status } = req.body

        var populateQuery = [
            { path: "ToUserID", module: "Users" },
            { path: "ByUserID", module: "Users" }
        ];

        const myreq = await friendRequestSchema
            .findById(id)
            .populate(populateQuery)

        if (!myreq) {
            res.status(200).json({ error: "no request found" })
        }
        if (myreq.status === "accepted") {
            res.status(400).json({ error: "friend request is already accepted" })
        } else {



            const acceptRecquest = await friendRequestSchema.findByIdAndUpdate(
                myreq?._id,
                {
                    status: status
                }, {
                runValidators: false,
                new: true
            })

            // add user to recivers friendlist ---> means the user(A) who recives the request will add the user(B) who sent the request into his(A) friendlist
            const requestRecivedTo = await User.findById(myreq.ToUserID);
            // checking for duplicate
            const checkforReciver = User.friendList.
                findIndex(friend => friend.friendID.toString() === friend.toString());
            if (checkforReciver === -1) {

                requestRecivedTo.firendList.push({
                    friendID: myreq.ByUserID._id,
                    friendAddedAt: Date.now()
                })
                await requestRecivedTo.save();
            }

            // add user to sender friendlist---> means the user(B) who had sent the request will add the user(A ) into his(B) friendlist 
            const requestSentBy = await User.findById(myreq.ByUserID);
            const checkforSender = User.friendList.  //check for duplicate
                findIndex(friend => friend.friendID.toString() === friend.toString());
            if (checkforSender === -1) {
                requestSentBy.firendList.push({
                    friendID: myreq.ToUserID._id
                })
                await requestSentBy.save();
            }
            requestSentBy.firendList.push({
                friendID: myreq.ToUserID._id,
                friendAddedAt: Date.now()
            })
            await requestSentBy.save();


            res.status(200).json({ acceptRecquest })
        }

    } catch (error) {
        console.log(error)
        res.status(400).json({ error: error.message })
    }
}

exports.addFriends = async (req, res) => {
    try {
        const { id } = req.params
        const { status } = req.body

        var populateQuery = [
            { path: "ToUserID", module: "Users" },
            { path: "ByUserID", module: "Users" }
        ];

        const me = await User.findById(id)
            .populate("firendList.friendID", ["name", "email"])


        const myreq = friendRequestSchema
            .findById({ ToUserID: id })
            .populate(populateQuery)
            .select("status")
            .exec(async (err, myRequests) => {
                if (err) return res.status(400).json({ error: err.message })

                myRequests.forEach(async friendRequest => {
                    if (friendRequest.status === "accepted") {

                        const friendIndex = me.firendList.findIndex(friend => friend.friendID.toString() === friendRequest.ByUserID._id.toString());

                        if (friendIndex === -1) {
                            // Add the friend to the friend list
                            me.firendList.push({
                                friendID: friendRequest.ByUserID._id,
                                friendAddedAt: Date.now()
                            });
                            me.save(function (err) {
                                if (err) return res.status(400).json({ error: err.message })
                                return res.status(400).json({ message: "Friend added to the friend list" })
                            });
                        } else {
                            console.log('Friend already in the friend list');
                        }
                    }
                })
            })





        if (!myreq) {
            res.status(200).json({ error: "no request found" })
        }



        // add user to recivers friendlist ---> means the user(A) who recives the request will add the user(B) who sent the request into his(A) friendlist
        const requestRecivedTo = await User.findById(myreq.ToUserID);
        // checking for duplicate
        const checkforReciver = User.friendList.
            findIndex(friend => friend.friendID.toString() === friend.toString());
        if (checkforReciver === -1) {

            requestRecivedTo.firendList.push({
                friendID: myreq.ByUserID._id,
                friendAddedAt: Date.now()
            })
            await requestRecivedTo.save();
        }

        // add user to sender friendlist---> means the user(B) who had sent the request will add the user(A ) into his(B) friendlist 
        const requestSentBy = await User.findById(myreq.ByUserID);
        const checkforSender = User.friendList.  //check for duplicate
            findIndex(friend => friend.friendID.toString() === friend.toString());
        if (checkforSender === -1) {
            requestSentBy.firendList.push({
                friendID: myreq.ToUserID._id
            })
            await requestSentBy.save();
        }
        requestSentBy.firendList.push({
            friendID: myreq.ToUserID._id,
            friendAddedAt: Date.now()
        })
        await requestSentBy.save();


        res.status(200).json({ acceptRecquest })


    } catch (error) {
        console.log(error)
        res.status(400).json({ error: error.message })
    }
}

// get friend list
exports.getMyFriends = async (req, res) => {
    try {
        const { id } = req.params
        const { ByUserID, Status } = req.body
        const getME = User.findById(id)

        var populateQuery = [
            { path: "firendList.friendID", module: "Users" },
        ];
        const seemyfriends = await User.findById(id)
            .populate("firendList.friendID", ["name", "email"])
            .select("firendList")

        res.status(200).json({ seemyfriends })

    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

//delete or reject request
exports.deleteRequest = async (req, res) => {
    try {
        const { id } = req.params

        const checkReq = await friendRequestSchema.findById(id)
        if (checkReq) {
            const deleteRequest = await friendRequestSchema.findByIdAndDelete(id)

            return res.status(200).json({ deleteRequest })
        }
        res.status(400).json({ error: "no request found" })

    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}


// handeling request by request id and updatefriendlist
exports.handelRequestById = async (req, res) => {
    try {
        const { id } = req.params
        const { status } = req.body

        var populateQuery = [
            { path: "ToUserID", module: "Users" },
            { path: "ByUserID", module: "Users" }
        ];

        const myreq = await friendRequestSchema
            .findById(id)
            .populate(populateQuery)

        if (!myreq) {
            res.status(200).json({ error: "no request found" })
        }
        if (myreq.status === "accepted") {
            res.status(400).json({ error: "friend request is already accepted" })
        } else {
            const acceptRecquest = await friendRequestSchema.findByIdAndUpdate(
                myreq?._id,
                {
                    status: status
                }, {
                runValidators: false,
                new: true
            })
            let deleteRequest
            //delete accepted request
            if (status === "rejected" || acceptRecquest) {

                deleteRequest = await friendRequestSchema.findByIdAndDelete(id)
            }
            //  res.status(200).json({ deleteRequest })

            // add user to recivers friendlist
            const requestRecivedTo = await User.findById(myreq.ToUserID);
            requestRecivedTo.friendList.push({
                friendID: myreq.ByUserID._id,
                friendAddedAt: Date.now()
            })
            await requestRecivedTo.save();


            // add user to sender friendlist 
            const requestSentBy = await User.findById(myreq.ByUserID);
            requestSentBy.friendList.push({
                friendID: myreq.ToUserID._id,
                friendAddedAt: Date.now()
            })
            await requestSentBy.save();


            res.status(200).json({ acceptRecquest, deleteRequest })
        }

    } catch (error) {
        console.log(error)
        res.status(400).json({ error: error.message })
    }
}
exports.sendFriendRequest = async (req, res) => {
    try {
        const { id } = req.params
        const { ToUserID } = req.body

        var populateQuery = [
            { path: "ToUserID", module: "Users" },
            { path: "ByUserID", module: "Users" }
        ];

        //check for request either by user or to user 
        // .findOne({
        //     $or: [
        //         { $and: [{ ToUserID: ToUserID }, { ByUserID: id }] },
        //         { $and: [{ ToUserID: id }, { ByUserID: ToUserID }] }
        //     ]
        // })

        const checkIfRequestExist = await friendRequestSchema
            .findOne({ ToUserID: ToUserID }, { ByUserID: id })
            .populate(populateQuery)
            .select("status")

        if (checkIfRequestExist === null) {
            const createRequest = await friendRequestSchema.create({
                ToUserID,
                ByUserID: id,
            })
            res.status(200).json({ createRequest })


        } else {
            return res.status(403).json({ error: `request is ${checkIfRequestExist?.status} can not send new request` })
        }


    } catch (error) {

        res.status(200).json({ error: error.message })
    }
}

