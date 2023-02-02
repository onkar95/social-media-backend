const express = require('express')
const userRoute = require('./Routes/UserRoutes')
const friendRoute = require('./Routes//FriendsRoutes')
const cookieParser = require('cookie-parser')
const dotenv = require('dotenv')
const { ConnectionTODB } = require('./config/DBConfig')
dotenv.config()

const port = process.env.PORT

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use('/user', userRoute)
app.use('/friend', friendRoute)

// connection to database
ConnectionTODB()
const server = app.listen(port, () => console.log(`server listining on port${port}`))