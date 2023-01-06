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
  const sauceObject = JSON.parse(req.body.sauce) // get the object 'sauce' from the form/data
  delete sauceObject._userId   // delete userId cause "Never Trust User Input"
  const sauce = new Sauces({ // make a new sauce 
    ...sauceObject,  // with the sauceObject from form/data
    userId: req.auth.userId, // with userId as UserId from auth.js 
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`, // with the file from form/data
  })
  sauce.save() // save the sauce
    .then(() => res.status(httpStatus.CREATED).json({ message: `La sauce ${sauce.name} a bien été enregistré 🌶️ !` }))
    .catch(error => 
      res.status(httpStatus.BAD_REQUEST).json({ error }))
}

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file // look if there's a file to upload in request form/data
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
        const fileToDelete = sauce.imageUrl.split('/images/')[1]    // get the filename
        fs.unlinkSync(`images/${fileToDelete}`) // delete file from DB
        Sauces.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id }) // update new sauce
          .then(() => res.status(httpStatus.OK).json({ message: `La sauce ${sauceObject.name} a bien été modifié 🌶️ !` }))
          .catch(error => 
            res.status(httpStatus.NOT_MODIFIED).json({ error }))
      }
    })  
    .catch(error => 
      res.status(httpStatus.NOT_FOUND).json({ error }))
}

exports.deleteSauce = (req, res, next) => {
  Sauces.findOne({ _id: req.params.id }) // find the sauce
    .then(sauce => {
      if (sauce.userId !== req.auth.userId) { // verify if user is the sauce's owner
        res.status(httpStatus.UNAUTHORIZED).json({ message: 'non authorisé !' })
      } else {
        const filename = sauce.imageUrl.split('/images/')[1] // get filename from DB
        fs.unlink(`images/${filename}`, () => { // delete sauce as asynchronous then delete file from DB
          Sauces.deleteOne({ _id: req.params.id }) 
            .then(() => res.status(httpStatus.OK).json({ message: `la sauce ${sauce.name} a été supprimé 🌶️ !` }))
            .catch(error => 
              res.status(httpStatus.NOT_MODIFIED).json({ error }))
        })
      }
    })
    .catch(error => res.status(httpStatus.NOT_FOUND).json({ error }))
}
/*
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
      Sauces.updateOne({ _id: req.params.id }, { $push: { usersDisliked: userId }, $inc: { dislikes: +1 } })
        .then(() => res.status(httpStatus.OK).json({ message: 'Vous disliké la sauce !' }))
        .catch(error => 
          res.status(httpStatus.BAD_REQUEST).json({ error }))
      break
    default:
      res.status(httpStatus.BAD_REQUEST).json({ error: "Valeur de 'like' non valide" });
      break
  }
}
*/
exports.modifySauceLike = (req, res, next) => {
  const userId = req.body.userId
  const like = req.body.like

  if (like !== 0 && like !== 1 && like !== -1) { // we manage the cases of errors
    return res.status(httpStatus.BAD_REQUEST).json({ error: "Valeur de 'like' non valide" })
  }

  Sauces.findOne({ _id: req.params.id })
    .then((sauce) => {
      // If the user had already given an opinion on the sauce, it is removed
      if (sauce.usersLiked.includes(userId)) { // if user had liked sauce
        Sauces.updateOne({ _id: req.params.id }, { $pull: { usersLiked: userId }, $inc: { likes: -1 } }) // we remove the like
          .then(() => res.status(httpStatus.OK).json({ message: "Votre like a été enlevé." }))
          .catch((error) => 
            res.status(httpStatus.BAD_REQUEST).json({ error }))
      } else if (sauce.usersDisliked.includes(userId)) { // if user had disliked sauce
        Sauces.updateOne({ _id: req.params.id }, { $pull: { usersDisliked: userId }, $inc: { dislikes: -1 } }) // we remove the dislike
          .then(() => res.status(httpStatus.OK).json({ message: "Votre dislike a été enlevé." }))
          .catch((error) => 
            res.status(httpStatus.BAD_REQUEST).json({ error }))
      } else {
        // The user had not yet given an opinion on the sauce, we add his opinion.
        if (like === 1) { // if user like
          Sauces.updateOne({ _id: req.params.id }, { $push: { usersLiked: userId }, $inc: { likes: 1 } }) // we update sauce by pushing userId in likes table and ++ likes
            .then(() => res.status(httpStatus.OK).json({ message: "Vous avez liké la sauce 🌶️ !" }))
            .catch((error) => 
              res.status(httpStatus.BAD_REQUEST).json({ error }))
        } else if (like === -1) { // if user don't like
          Sauces.updateOne({ _id: req.params.id }, { $push: { usersDisliked: userId }, $inc: { dislikes: 1 } }) // we update sauce by pushing userId in dislikes table and ++ dislikes
            .then(() => res.status(httpStatus.OK).json({ message: "Vous avez disliké la sauce !" }))
            .catch((error) => 
              res.status(httpStatus.BAD_REQUEST).json({ error }))
        }
      }
    })
    .catch((error) => 
      res.status(httpStatus.NOT_FOUND).json({ error }))
}
