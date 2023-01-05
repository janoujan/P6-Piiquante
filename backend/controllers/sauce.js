const Sauces = require('../models/sauces')
const fs = require('fs')
const httpStatus = require('http-status')

exports.findAllSauce = (req, res, next) => {
  Sauces.find()
    .then(sauces => res.status(httpStatus.OK).json(sauces))
    .catch(error =>
       res.status(httpStatus.BAD_REQUEST).json({ error }))
}

exports.findOneSauce = (req, res, next) => {
  Sauces.findOne({ _id: req.params.id })
    .then(sauce => res.status(httpStatus.OK).json(sauce))
    .catch(error => 
      res.status(httpStatus.NOT_FOUND).json({ error }))
}
exports.createSauce = (req, res, next) => {
  // get the object 'sauce' from the form/data
  const sauceObject = JSON.parse(req.body.sauce)
  // delete userId cause "Never Trust User Input"
  delete sauceObject._userId
  // make a new sauce with userId as UserId from auth.js and add image to sauce
  const sauce = new Sauces({
    ...sauceObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
  })
  // save the sauce
  sauce.save()
    .then(() => res.status(httpStatus.CREATED).json({ message: `La sauce ${sauce.name} a bien été enregistré 🌶️ !` }))
    .catch(error => 
      res.status(httpStatus.BAD_REQUEST).json({ error }))
}

exports.modifySauce = (req, res, next) => {
  // look if there's a file to upload in request form/data
  const sauceObject = req.file
    ? {  // the file exists so we parse the JSON object and we get the file ready for multer
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
      }
    : { ...req.body } // there is no file so we get all the request
  delete sauceObject.userId  // Never Trust User Input : we delete userId
  Sauces.findOne({ _id: req.params.id })  // we look for the sauce in DB
    .then(sauce => {
      if (sauce.userId !== req.auth.userId) { // kick off opportunist by comparing sauce owner id and authentication id
        res.status(httpStatus.UNAUTHORIZED).json({ message: 'Unauthorized request' })
      } else {  // user is the owner so we delete the old file from DB and update the sauce
        const fileToDelete = sauce.imageUrl.split('/images/')[1]
        console.log(fileToDelete)
        fs.unlinkSync(`images/${fileToDelete}`)
        Sauces.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
          .then(() => res.status(httpStatus.OK).json({ message: `La sauce ${sauceObject.name} a bien été modifié 🌶️ !` }))
          .catch(error => 
            res.status(httpStatus.NOT_MODIFIED).json({ error }))
      }
    })  
    .catch(error => 
      res.status(httpStatus.NOT_FOUND).json({ error }))
}

exports.deleteSauce = (req, res, next) => {
  Sauces.findOne({ _id: req.params.id })
    .then(sauce => {
      if (sauce.userId !== req.auth.userId) {
        res.status(httpStatus.UNAUTHORIZED).json({ message: 'non authorisé !' })
      } else {
        const filename = sauce.imageUrl.split('/images/')[1]
        fs.unlink(`images/${filename}`, () => {
          Sauces.deleteOne({ _id: req.params.id })
            .then(() => res.status(httpStatus.OK).json({ message: `la sauce ${sauce.name} a été supprimé 🌶️ !` }))
            .catch(error => 
              res.status(httpStatus.NOT_MODIFIED).json({ error }))
        })
      }
    })
    .catch(error => res.status(httpStatus.NOT_FOUND).json({ error }))
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
              .then(() => res.status(httpStatus.OK).json({ message: 'votre like a été enlevé' }))
              .catch(error => 
                res.status(httpStatus.BAD_REQUEST).json({ error }))
          }
          // si l'utilisateur avait disliké
          if (sauce.usersDisliked.includes(userId)) {
            Sauces.updateOne({ _id: req.params.id }, { $pull: { usersDisliked: userId }, $inc: { dislikes: -1 } })
              .then(() => res.status(httpStatus.OK).json({ message: 'votre dislike a été enlevé' }))
              .catch(error =>
                res.status(httpStatus.BAD_REQUEST).json({ error }))
          }
        })
        .catch(error => 
          res.status(httpStatus.NOT_FOUND).json({ error }))
      break
    case 1:
      Sauces.updateOne({ _id: req.params.id }, { $push: { usersLiked: userId }, $inc: { likes: +1 } })
        .then(() => res.status(httpStatus.OK).json({ message: 'Vous liké la sauce 🌶️ !' }))
        .catch(error => 
          res.status(httpStatus.BAD_REQUEST).json({ error }))

      break
    case -1:
      Sauces.updateOne({ id: req.params.id }, { $push: { usersDisliked: userId }, $inc: { dislikes: +1 } })
        .then(() => res.status(httpStatus.OK).json({ message: 'Vous disliké la sauce !' }))
        .catch(error => 
          res.status(httpStatus.BAD_REQUEST).json({ error }))
      break
    default:
      res.status(httpStatus.BAD_REQUEST).json({ error: "Valeur de 'like' non valide" });
      break
  }
}
