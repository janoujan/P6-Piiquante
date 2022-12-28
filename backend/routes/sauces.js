const express = require('express')
const router = express.Router()
const multer = require('../middleware/multer-config')
const auth = require('../middleware/auth')

const saucesCtrl = require('../controllers/sauce')

router.post('/', auth, multer, saucesCtrl.createSauce)
router.get('/:id', auth, saucesCtrl.findOneSauce)
router.put('/:id', auth, multer, saucesCtrl.modifySauce)
router.delete('/:id', auth, saucesCtrl.deleteSauce)
router.get('/' + '', auth, saucesCtrl.findAllSauce)

module.exports = router
