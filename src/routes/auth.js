const express = require('express')
const { loginController, logoutController, registerController, profileController } = require('../controllers/auth.controller')

const router  = express.Router()

router.post('/login', loginController)
router.post('/logout', logoutController)
router.post('/register', registerController)
router.get('/me', profileController)

module.exports = router