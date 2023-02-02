const { validationResult } = require('express-validator');
const User = require('../module/userSchema');
const bcrypt = require('bcrypt');
const createAndSendJWT = require('../utils/CreateJWT');
const friendRequestSchema = require('../module/friendRequestSchema');

//create user ---- C --CURD
exports.RegisterUser = async (req, res) => {
    const session = req.session;
    try {
        const { name, email, password } = req.body;

        //express validator
        const err = validationResult(req);
        if (!err.isEmpty()) {
            return res.status(400).json({ errors: err.array() });
        }

        // checking for duplicate user
        let user = await User.findOne({
            email
        });

        if (user) {
            return res.status(200).json({ errors: "user already exist" });
        }

        //hashing password before storing
        let hashed_password = await bcrypt.hash(password, 10);

        const createdUser = await User.create([
            {
                name,
                email,
                password: hashed_password
            }
        ], { session });

        // Commit the transaction
        await session.commitTransaction();

        //create jwt token send res to user
        createAndSendJWT(createdUser, res);
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: error.message });

        // If there is an error, abort the transaction
        await session.abortTransaction();
    } finally {
        if (session) {
            req.session.endSession() || session.endSession();
        }
    }
};
exports.Login = async (req, res) => {
    const session = req.session;
    try {
        const { email, password } = req.body

        //express-validator
        const err = validationResult(req)
        if (!err.isEmpty()) {
            return res.status(400).json({ errors: err.array() })
        }

        //checking for email
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(200).json({ errors: "Invalid email or password" });
        }

        // verifing password for user
        const match = bcrypt.compare(password, user.password)
        if (!match) {
            return res.status(200).json({ errors: "Invalid email or password" });

        }

        //create jwt token send res to user
        createAndSendJWT(user, res)

        // Commit the transaction
        await session.commitTransaction();
    } catch (error) {
        res.status(400).json({ error: error.message })
        await session.abortTransaction();
    } finally {
        if (session) {
            req.session.endSession() || session.endSession();
        }
    }


}

//Read/get user ---- R --CURD
exports.GetAllUser = async (req, res) => {
    const session = req.session;
    try {

        // checking for  user
        let user = await User.find()
            .populate("friendList.friendID", ["name", "email"])
            .populate("friendRequests", ["ByUserID", "ToUserID", "status"])
        // .select("name , email , friendList")

        res.status(200).json({ user })
    } catch (error) {
        res.status(400).json({ error: error.message })
        await session.abortTransaction();
    } finally {
        if (session) {
            req.session.endSession() || session.endSession();
        }
    }
}

exports.GetSingelUser = async (req, res) => {
    const session = req.session;
    try {
        const { id } = req.params
        //express validator
        const err = validationResult(req)
        if (!err.isEmpty()) {
            return res.status(400).json({ errors: err.array() })
        }

        // checking for  user
        let user = await User.findById(id)
            .populate("friendList.friendID", ["name", "email"])
            .select("name , email , friendList")

        if (!user) {
            return res.status(200).json({ errors: "user does not  exist" });
        }

        res.status(200).json({ user })
    } catch (error) {
        res.status(400).json({ error: error.message })
        await session.abortTransaction();
    } finally {
        if (session) {
            req.session.endSession() || session.endSession();
        }
    }


}

//update 
exports.updateUser = async (req, res) => {
    const session = req.session;
    try {
        const { id } = req.params
        //express validator
        const err = validationResult(req)
        if (!err.isEmpty()) {
            return res.status(400).json({ errors: err.array() })
        }

        // checking for  user
        let user = await User.findById(id)
        if (!user) {
            return res.status(200).json({ errors: "user does not  exist" });
        }

        const { name, email } = req.body

        const newData = {
            name,
            email,
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            newData,
            {
                new: true,
                runValidators: true,
                session
            })

        // Commit the transaction
        await session.commitTransaction();


        res.status(200).json({ updatedUser })
    } catch (error) {
        console.log(error)
        res.status(400).json({ error: error.message })
        await session.abortTransaction();
    } finally {
        if (session) {
            req.session.endSession() || session.endSession();
        }
    }


}

// delete user
exports.deleteUser = async (req, res) => {
    const session = req.session;
    try {
        const { id } = req.params
        //express validator
        const err = validationResult(req)
        if (!err.isEmpty()) {
            return res.status(400).json({ errors: err.array() })
        }

        // Find the user to be deleted
        const user = await User.findById(id);
        if (!user) {
            return res.status(400).json({ error: "user not found" })
        }
        // Remove the user from other users' friend lists
        await User.updateMany(
            { friendList: { $elemMatch: { friendID: user._id } } },
            { $pull: { friendList: { friendID: user._id } } },
            { session }
        );

        // Delete any pending friend requests related to the user
        await friendRequestSchema.deleteMany({
            $or: [{ ByUserID: user._id }, { ToUserID: user._id }],
        }, { session });
        // Finally, delete the user
        await user.remove();

        // Commit the transaction
        await session.commitTransaction();

        return res.status(400).json({ message: 'User deleted successfully' })
    } catch (error) {
        res.status(400).json({ error: `Error deleting user: ${error.message}` })
        await session.abortTransaction();
    } finally {
        if (session) {
            req.session.endSession() || session.endSession();
        }
    }


}


