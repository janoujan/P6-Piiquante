const Sauces = require('../models/sauces')
const fs = require('fs')

exports.findAllSauce = (req, res, next) => {
  Sauces.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({ error }))
}

exports.findOneSauce = (req, res, next) => {
  Sauces.findOne({ _id: req.params.id })
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(404).json({ error }))
}
exports.createSauce = (req, res, next) => {
  console.log(req.body, req.body.sauce);
  const sauceObject = JSON.parse(req.body.sauce)
  delete sauceObject._userId
  const sauce = new Sauces({
    ...sauceObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
  })
  sauce.save()
    .then(() => res.status(201).json({ message: `La sauce ${sauce.name} a bien été enregistré 🌶️ !` }))
    .catch(error => res.status(400).json({ error }))
}

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file
    ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
      }
    : { ...req.body }
    console.log('coucou', sauceObject)
  delete sauceObject.userId

  Sauces.findOne({ _id: req.params.id })
    .then(sauce => {
      if (sauce.userId !== req.auth.userId) {
        res.status(403).json({ message: 'unauthorized request' })
      } else {
        Sauces.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
          .then(() => res.status(200).json({ message: `La sauce ${sauceObject.name} a bien été modifié 🌶️ !` }))
          .catch(error => res.status(401).json({ error }))
      }
    })
    .catch(error => res.status(400).json({ error }))
}

exports.deleteSauce = (req, res, next) => {
  Sauces.findOne({ _id: req.params.id })
    .then(sauce => {
      if (sauce.userId !== req.auth.userId) {
        res.status(401).json({ message: 'non authorisé !' })
      } else {
        const filename = sauce.imageUrl.split('/images/')[1]
        fs.unlink(`images/${filename}`, () => {
          Sauces.deleteOne({ _id: req.params.id })
            .then(() => res.status(200).json({ message: `la sauce ${sauce.name} a été supprimé 🌶️ !` }))
            .catch(error => res.status(401).json({ error }))
        })
      }
    })
    .catch(error => res.status(500).json({ error }))
}

exports.modifySauceLike = (req, res, next) => {
  console.log(req.body)
  const userId = req.body.userId
  const like = req.body.like
  switch (like) {
    case 0:
      Sauces.findOne({ _id: req.params.id })
        .then(sauce => {
          // si l'utilisateur avait liké
          if (sauce.usersLiked.includes(userId)) {
            Sauces.updateOne({ _id: req.params.id }, { $pull: { usersLiked: userId }, $inc: { likes: -1 } })
              .then(() => res.status(200).json({ message: 'votre like a été enlevé' }))
              .catch(error => res.status(400).json({ error }))
          }
          // si l'utilisateur avait disliké
          if (sauce.usersDisliked.includes(userId)) {
            Sauces.updateOne({ _id: req.params.id }, { $pull: { usersDisliked: userId }, $inc: { dislikes: -1 } })
              .then(() => res.status(200).json({ message: 'votre dislike a été enlevé' }))
              .catch(error => res.status(400).json({ error }))
          }
        })
        .catch(error => res.status(400).json({ error }))
      break
    case 1:
      Sauces.updateOne({ _id: req.params.id }, { $push: { usersLiked: userId }, $inc: { likes: +1 } })
        .then(() => res.status(200).json({ message: 'Vous liké la sauce 🌶️ !' }))
        .catch(error => res.status(400).json({ error }))

      break
    case -1:
      Sauces.updateOne({ id: req.params.id }, { $push: { usersDisliked: userId }, $inc: { dislikes: +1 } })
        .then(() => res.status(200).json({ message: 'Vous disliké la sauce !' }))
        .catch(error => res.status(400).json({ error }))
      break
  }
}
