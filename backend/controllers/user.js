const bcrypt = require('bcrypt')
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const httpStatus = require('http-status')

dotenv.config()
const TOKEN = process.env.TOKEN

exports.signup = (req, res, next) => {
  bcrypt.hash(req.body.password, 10)
    .then(hash => {
      const user = new User({
        email: req.body.email,
        password: hash
      })
      user.save()
        .then(() => res.status(httpStatus.CREATED).json({ message: 'utilisateur créé !' }))
        .catch(error => 
          res.status(httpStatus.NETWORK_AUTHENTICATION_REQUIRED).json({ error }))
    })
    .catch(error => 
      res.status(httpStatus.NETWORK_AUTHENTICATION_REQUIRED).json({ error }))
}

exports.login = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then(user => {
      if (user === null) {
        res.status(httpStatus.NETWORK_AUTHENTICATION_REQUIRED).json({ error })
      } else {
        bcrypt.compare(req.body.password, user.password)
          .then(valid => {
            if (!valid) {
              res.status(httpStatus.NETWORK_AUTHENTICATION_REQUIRED).json({ error })
            } else {
              res.status(httpStatus.OK).json({
                userId: user._id,
                token: jwt.sign(
                  { userId: user._id },
                  TOKEN,
                  { expiresIn: '24h' }
                )
              })
            }
          })
          .catch(error => res.status(httpStatus.NETWORK_AUTHENTICATION_REQUIRED).json({ error }))
      }
    })
    .catch(error => res.status(httpStatus.NETWORK_AUTHENTICATION_REQUIRED).json({ error }))
}
