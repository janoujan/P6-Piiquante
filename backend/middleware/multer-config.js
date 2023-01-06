const multer = require('multer')

const MIME_TYPES = { // MIME_TYPES dictionnary to resolve extension name
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
}
// we configure multer with destination and filename
const storage = multer.diskStorage({ 
  destination: (req, file, callback) => {
    callback(null, 'images')
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(' ').join('_') // to prevent bug we get rid of whitespaces
    const extension = MIME_TYPES[file.mimetype] // we resolve extension name with MYME_TYPES dictionnary
    callback(null, name + Date.now() + '.' + extension) // filename concatenate name + timestamp + extension
  }
})

module.exports = multer({ storage }).single('image')
