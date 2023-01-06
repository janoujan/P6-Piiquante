const bcrypt = require('bcrypt')
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const httpStatus = require('http-status')

dotenv.config()
const TOKEN = process.env.TOKEN

exports.signup = (req, res, next) => {
  bcrypt.hash(req.body.password, 10) // hash and salt password
    .then(hash => {
      const user = new User({ // make a new user
        email: req.body.email,
        password: hash // with password as a hash
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
  User.findOne({ email: req.body.email }) // find user
    .then(user => {
      if (user === null) { // if user not found throw error
        res.status(httpStatus.UNAUTHORIZED).json({ error })
      } else {
        bcrypt.compare(req.body.password, user.password) // user found so let bcrypt compare hashes
          .then(valid => {
            if (!valid) { // if comparison isn't valid throw error
              res.status(httpStatus.UNAUTHORIZED).json({ error })
            } else {
              res.status(httpStatus.OK).json({
                userId: user._id,
                token: jwt.sign(  // we assign a token to the user for future authentication before future processing
                  { userId: user._id },
                  TOKEN,
                  { expiresIn: '24h' }
                )
              })
            }
          })
          .catch(error => 
            res.status(httpStatus.NETWORK_AUTHENTICATION_REQUIRED).json({ error }))
      }
    })
    .catch(error => 
      res.status(httpStatus.NETWORK_AUTHENTICATION_REQUIRED).json({ error }))
}
