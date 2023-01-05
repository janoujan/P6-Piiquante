const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const httpStatus = require('http-status')

dotenv.config()
const TOKEN = process.env.TOKEN

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1]
    const decodedToken = jwt.verify(token, TOKEN)
    const userId = decodedToken.userId
    req.auth = {
      userId
    }
    next()
  } catch (error) {
    res.status(httpStatus.UNAUTHORIZED).json({ error })
  }
}
