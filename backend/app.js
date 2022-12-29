const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')

const path = require('path')
const userRoutes = require('./routes/user')
const saucesRoutes = require('./routes/sauces')

const app = express()

mongoose.connect('mongodb+srv://janoujan:SDFsdfsdf@cluster0.lqpegbm.mongodb.net/?retryWrites=true&w=majority',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'))

app
  .use(express.json())
  .use(cors())
  .use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

app.use('/api/auth', userRoutes)
app.use('/api/sauces', saucesRoutes)
app.use('/images', express.static(path.join(__dirname, 'images')))

module.exports = app
