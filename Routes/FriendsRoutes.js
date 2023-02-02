const { Router } = require('express');
const { startMySession } = require('../config/DBConfig');
const { sendFriendRequest, getMyFriendRequest, getAllFriendRequest, handelMyFriendRequest, handelRequestById, getMyFriends, deleteRequest, testingSession } = require('../Controller/FriendsController');
const { valiadtionQuerry } = require('../middleware/expressValidator');
const router = Router();

router.post('/sendRequest/:id', startMySession, valiadtionQuerry, sendFriendRequest)
router.get('/getMyRequests/:id', startMySession, valiadtionQuerry, getMyFriendRequest)
router.put('/handelRequestById/:id', startMySession, valiadtionQuerry, handelRequestById)
router.get('/getmyfriends/:id', startMySession, valiadtionQuerry, getMyFriends)
router.delete('/deleteRequest/:id', startMySession, valiadtionQuerry, deleteRequest)


router.get('/getAllRequests', startMySession, getAllFriendRequest)
// router.put('/test', startMySession, testingSession)



module.exports = router
