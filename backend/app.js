const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize'); // get rid of $ everywhere in req.
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

// app.options('*', cors());

app
  .use(express.json());
  //.use(cors());
  // .use(mongoSanitize({ replaceWith: '_' }));


// Sets "Cross-Origin-Resource-Policy: cross-origin"
// app.use(helmet.crossOriginResourcePolicy({ policy: "same-origin" }));

// app.use(helmet.crossOriginOpenerPolicy({ policy: "same-origin" }));

// Sets "Content-Security-Policy: default-src 'self';script-src 'self' example.com;"
// app.use(
//   helmet.contentSecurityPolicy({
//     useDefaults: false,
//     directives: {
//       scriptSrc: ["'self'", "http://localhost:3000"],
//       defaultSrc: ["'self'", "http://localhost:3000" ],
//     },
//   })
// );

// app.use(
//   helmet.referrerPolicy({
//     policy: ["origin", "unsafe-url"],
//   })
// );

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.use('/api/auth', userRoutes);
app.use('/api/sauces', saucesRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));

// display build of the front in backend
app.use(express.static('frontend'))

module.exports = app;
