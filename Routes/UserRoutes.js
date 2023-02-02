const { Router } = require('express');
const { startMySession } = require('../config/DBConfig');
const { RegisterUser, GetAllUser, GetSingelUser, Login, updateUser, deleteUser, deleteSomeField } = require('../Controller/UserController');
const { valiadtionQuerry } = require('../middleware/expressValidator');
const router = Router();

router.post('/register', startMySession, valiadtionQuerry, RegisterUser)
router.post('/login', startMySession, valiadtionQuerry, Login)
router.put('/updateUser/:id', startMySession, valiadtionQuerry, updateUser)
router.get('/singelUser/:id', startMySession, valiadtionQuerry, GetSingelUser)

router.get('/Allusers', startMySession, GetAllUser)


router.delete('/deleteUser/:id', startMySession, valiadtionQuerry, deleteUser)
// router.put('/deleteSomeField', valiadtionQuerry, deleteSomeField)



module.exports = router
