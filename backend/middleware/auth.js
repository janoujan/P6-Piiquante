const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const httpStatus = require('http-status')

dotenv.config()
const TOKEN = process.env.TOKEN

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1] // get rid of "bearer"
    const decodedToken = jwt.verify(token, TOKEN)  // verify token
    const userId = decodedToken.userId // token is verified so we assign the userId from the token to user cause we never trust user input
    req.auth = {
      userId
    }
    next()
  } catch (error) {
    res.status(httpStatus.UNAUTHORIZED).json({ error })
  }
}
