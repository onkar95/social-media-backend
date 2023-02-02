const mongoose = require('mongoose')
let Mymodule;
const ConnectionTODB = async () => {

    await mongoose.connect(process.env.MongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
        .then((data) => console.log(`mongoDb connected with server:-->${data.connection.host}`))
        .catch((err) => console.log(err.message))
}
const startMySession = async (req, res, next) => {
    if (!req.session) {
        let session = await mongoose.startSession();
        session.startTransaction();
        req.session = session;
    }
    next()
};

module.exports = { ConnectionTODB, startMySession };