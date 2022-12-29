const express = require('express')
const router = express.Router()
const multer = require('../middleware/multer-config')
const auth = require('../middleware/auth')

const saucesCtrl = require('../controllers/sauce')

router.get('/', auth, saucesCtrl.findAllSauce)
router.get('/:id', auth, saucesCtrl.findOneSauce)
router.post('/', auth, multer, saucesCtrl.createSauce)
router.put('/:id', auth, multer, saucesCtrl.modifySauce)
router.delete('/:id', auth, saucesCtrl.deleteSauce)
router.post('/:id/like', auth, saucesCtrl.modifySauceLike)

module.exports = router
