const express = require('express')
const router = express.Router()
const userCtrl = require('../controllers/user')
const rateLimit = require('express-rate-limit')

// protection for bruteForce attack
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1min
  max: 10, // 10 request max by min and by IP address
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
})

router.post('/signup', userCtrl.signup)
router.post('/login', apiLimiter, userCtrl.login)

module.exports = router
