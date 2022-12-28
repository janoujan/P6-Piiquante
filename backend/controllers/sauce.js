const Sauces = require('../models/sauces')

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce)
  delete sauceObject._id
  delete sauceObject._userId
  const sauce = new Sauces({
    ...sauceObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  })
  sauce.save()
    .then(() => res.status(201).json({ message: 'sauce enregistrée !' }))
    .catch(error => res.status(400).json({ error }))
}

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file
    ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
      }
    : { ...req.body }
  delete sauceObject._userId
  Sauces.findOne({ _id: req.params.id })
    .then(sauce => {
      if (sauce.userId !== req.auth.userId) {
        res.status(401).json({ message: 'non authorisé !' })
      } else {
        Sauces.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Sauce modifiée !' }))
          .catch(error => res.status(401).json({ error }))
      }
    })
    .catch(error => res.status(400).json({ error }))
}

exports.deleteSauce = (req, res, next) => {
  Sauces.deleteOne({ _id: req.params.id }).then(
    () => {
      res.status(200).json({
        message: 'Deleted!'
      })
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error
      })
    }
  )
}

exports.findAllSauce = (req, res, next) => {
  Sauces.find().then(
    (things) => {
      res.status(200).json(things)
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error
      })
    }
  )
}

exports.findOneSauce = (req, res, next) => {
  Sauces.findOne({
    _id: req.params.id
  }).then(
    (thing) => {
      res.status(200).json(thing)
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error
      })
    }
  )
}
