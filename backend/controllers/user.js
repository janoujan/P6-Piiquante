const bcrypt = require('bcrypt')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const httpStatus = require('http-status')
const user = require('../models/user')

exports.signup = async (req, res, next) => {
  console.log(
    'password========',
    req.body.password,
    'email========',
    req.body.email,
    'round.env========',
    process.env.ROUND
  )
 await bcrypt
    .hash(req.body.password, process.env.ROUND) // hash, salt and round password
    .then(hash => {
      const user = new User({
        // make a new user
        email: req.body.email,
        password: hash // with password as a hash
      }).then(user => console.log('userafterhash========', user))

      user
        .save()
        .then(() =>
          res.status(httpStatus.CREATED).json({ message: 'utilisateur créé !' })
        )
        .catch(error =>
          res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({ message: 'save error' })
        )
    })
    .catch(error =>
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'erreur de hash' })
    )
}

exports.login = (req, res, next) => {
  User.findOne({ email: req.body.email }) // find user
    .then(user => {
      if (user === null) {
        // if user not found throw error
        res.status(httpStatus.UNAUTHORIZED).json({ error })
      } else {
        bcrypt
          .compare(req.body.password, user.password) // user found so let bcrypt compare hashes
          .then(valid => {
            if (!valid) {
              // if comparison isn't valid throw error
              res.status(httpStatus.UNAUTHORIZED).json({ error })
            } else {
              res.status(httpStatus.OK).json({
                // then every cases are OK
                userId: user._id,
                token: jwt.sign(
                  // we assign a token to the user for future authentication before future processing
                  { userId: user._id },
                  process.env.TOKEN,
                  { expiresIn: '24h' }
                )
              })
            }
          })
          .catch(error =>
            res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error })
          )
      }
    })
    .catch(error =>
      res.status(httpStatus.NETWORK_AUTHENTICATION_REQUIRED).json({ error })
    )
}
