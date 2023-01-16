const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const httpStatus = require('http-status')

dotenv.config()

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1] // get rid of "bearer"
    const decodedToken = jwt.verify(token, process.env.TOKEN) // verify token
    const userId = decodedToken.userId // token is verified so we assign the userId from the token to user cause we never trust user input
    req.auth = {
      userId
    }

    if (req.body.userId !== req.auth.userId) {
      throw new Error('User id error')
    }
    next()
  } catch (Error) {
    res.status(httpStatus.UNAUTHORIZED).json(Error.name + ':' + Error.message)
  }
}
