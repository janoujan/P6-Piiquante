const bcrypt = require('bcrypt');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');

exports.signup = (req, res, next) => {
 bcrypt.hash(req.body.password, 10) 
    .then((hash) => {
      const user = new User({ 
        email: req.body.email,
        password: hash
      });
      user.save()
        .then(() => { 
          res.status(httpStatus.OK).json({message: "Utilisateur créé ! 🌶️"})})
        .catch(error => res.status(httpStatus.UNAUTHORIZED).json({ error }));
    })
    .catch(error => res.status(httpStatus.UNAUTHORIZED).json({ error }));
};



exports.login = (req, res, next) => {
  User.findOne({ email: req.body.email }) 
    .then(user => {
      if (user === null) {
        res.status(httpStatus.UNAUTHORIZED).json({ error })
      } else {
        bcrypt
          .compare(req.body.password, user.password)
          .then(valid => {
            if (!valid) {
              res.status(httpStatus.UNAUTHORIZED).json({  error })
            } else {
              res.status(httpStatus.OK).json({
                userId: user._id,
                token: jwt.sign(
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
};
