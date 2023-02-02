const jwt = require('jsonwebtoken')

const createAndSendJWT = async (user, res) => {
    const token = jwt.sign({ id: user?._id }, process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE })
    if (token) {

        const options = {
            expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 100),
            httpOnly: true
        }
        res.status(200).cookie("Token", token, options).json({
            user,
            token
        })
    }

}

module.exports = createAndSendJWT;