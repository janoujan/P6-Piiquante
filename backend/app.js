const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize') ;// get rid of $ everywhere in req.
const mongodbErrorHandler = require('mongoose-mongodb-errors');

const path = require('path');
const userRoutes = require('./routes/user');
const saucesRoutes = require('./routes/sauces');

const app = express();
dotenv.config();

mongoose
  .connect(process.env.DBACCESS, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('Connexion à MongoDB réussie 👍!'))
  .catch(() => console.log('Connexion à MongoDB échouée 😨!'));

mongoose.plugin(mongodbErrorHandler);

app
  .use(express.json())
 .use(cors());
//  .use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
//   .use(mongoSanitize({ replaceWith: '_' }))

// Définition de headers pour éviters les erreurs de CORS
// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*')
//   res.setHeader(
//     'Access-Control-Allow-Headers',
//     'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization'
//   )
//   res.setHeader(
//     'Access-Control-Allow-Methods',
//     'GET, POST, PUT, DELETE, PATCH, OPTIONS'
//   )
//   next()
// })

  

app.use('/api/auth', userRoutes);
app.use('/api/sauces', saucesRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));

module.exports = app;
