const { check, validationResult } = require('express-validator')


exports.valiadtionQuerry = [
    check('name').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
    check('email').optional().isEmail().withMessage('Invalid email address'),
    check('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    check('ToUserID').optional().isMongoId().withMessage("please provide valid user id"),
    check('id').optional().isMongoId().withMessage("please provide valid user id"),
    check('status').optional().isIn(['accepted', 'rejected']),
]

exports.IsValidated = async (req, res, next) => {
    const valiadtionQuerry = [
        check('name').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
        check('email').optional().isEmail().withMessage('Invalid email address'),
        check('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),

    ]
    const { name, email, password } = req.body

    //express validator

    const err = validationResult(req.body, valiadtionQuerry)
    if (!err.isEmpty()) {
        return res.status(400).json({ errors: err.array() })
    } else {

        next()
    }

}

