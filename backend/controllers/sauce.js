const Sauces = require('../models/sauces')
const fs = require('fs')
const httpStatus = require('http-status')

exports.findAllSauce = (req, res, next) => {
  Sauces.find()
    .then(sauces => res.status(httpStatus.OK).json(sauces))
    .catch(error => res.status(httpStatus.BAD_REQUEST).json({ error }))
}

exports.findOneSauce = (req, res, next) => {
  Sauces.findOne({ _id: req.params.id })
    .then(sauce => res.status(httpStatus.OK).json(sauce))
    .catch(error => res.status(httpStatus.NOT_FOUND).json({ error }))
}
exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce) // get the object 'sauce' from the form/data
  delete sauceObject._userId // delete userId cause "Never Trust User Input"
  const sauce = new Sauces({
    // make a new sauce
    ...sauceObject, // with the sauceObject from form/data
    userId: req.auth.userId, // with userId as UserId from auth.js
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}` // with the URL to find our file from form/data
  })
  sauce
    .save() // save the new sauce
    .then(() =>
      res.status(httpStatus.CREATED).json({
        message: `La sauce ${sauce.name} a bien été enregistré 🌶️ !`,
        data: `${sauce}`
      })
    )
    .catch(error => res.status(httpStatus.BAD_REQUEST).json({ error }))
}

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file // look if there's a file to upload in request form/data
    ? {
        // if the file exists
        ...JSON.parse(req.body.sauce), // we parse the JSON object sauce
        imageUrl: `${req.protocol}://${req.get('host')}/images/${
          req.file.filename
        }` // we assign an URL to the file
      }
    : { ...req.body } // if there is no file we get all the request
  delete sauceObject.userId // Never Trust User Input : we delete userId
  Sauces.findOne({ _id: req.params.id }) // we look for the sauce in DB
    .then(sauce => {
      if (sauce.userId !== req.auth.userId) {
        // if user is not the sauce's owner, kick off
        res
          .status(httpStatus.UNAUTHORIZED)
          .json({ message: 'Unauthorized request' })
      } else {
        // user is the owner so we delete the old file from DB and update the sauce
        const fileToDelete = sauce.imageUrl.split('/images/')[1]
        fs.unlinkSync(`images/${fileToDelete}`)
        Sauces.updateOne(
          { _id: req.params.id },
          { ...sauceObject, _id: req.params.id }
        )
          .then(() =>
            res.status(httpStatus.OK).json({
              message: `La sauce ${sauceObject.name} a bien été modifié 🌶️ !`,
              data: `${JSON.stringify(sauceObject)}`
            })
          )
          .catch(error =>
            res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error })
          )
      }
    })
    .catch(error =>
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error })
    )
}

exports.deleteSauce = (req, res, next) => {
  Sauces.findOne({ _id: req.params.id }) // find the sauce
    .then(sauce => {
      if (sauce.userId !== req.auth.userId) {
        // verify if user is the sauce's owner
        res.status(httpStatus.UNAUTHORIZED).json({ message: 'non authorisé !' })
      } else {
        const filename = sauce.imageUrl.split('/images/')[1] // get filename from DB
        // fs.unlink() delete sauce in the callback then delete file from DB
        fs.unlink(`images/${filename}`, () => {
          Sauces.deleteOne({ _id: req.params.id })
            .then(() =>
              res
                .status(httpStatus.OK)
                .json({ message: `la sauce ${sauce.name} a été supprimé 🌶️ !` })
            )
            .catch(error => res.status(httpStatus.NOT_MODIFIED).json({ error }))
        })
      }
    })
    .catch(error => res.status(httpStatus.NOT_FOUND).json({ error }))
}

exports.modifySauceLike = async (req, res, next) => {
  const acceptableValues = [-1, 0, 1]

  try {
    // we verify if user is legit
    if (req.body.userId !== req.auth.userId) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: 'userId error' })
    }
    // we get userId and like state
    const userId = req.auth.userId
    const like = req.body.like
    // we manage the case of errors
    if (!acceptableValues.includes(like)) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ message: "Invalid 'like' value" })
    }
    const sauce = await Sauces.findOne({ _id: req.params.id })
    // if sauce isn't found we throw an error message
    if (!sauce)
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: 'Sauce not found' })
    // we get variables ready to test if user liked or disliked the sauce
    const isLiked = sauce.usersLiked.includes(userId)
    const isDisliked = sauce.usersDisliked.includes(userId)

    // Update like/dislike status and count in the database
    switch (like) {
      case 0:
        // the user had liked the sauce so he wants to remove his like
        if (isLiked) {
          await Sauces.updateOne(
            { _id: req.params.id },
            { $pull: { usersLiked: userId }, $inc: { likes: -1 } }
          )
          return res
            .status(httpStatus.OK)
            .json({ message: 'Your like has been removed' })
          // the user had disliked the sauce so he wants to remove his dislike
        } else if (isDisliked) {
          await Sauces.updateOne(
            { _id: req.params.id },
            { $pull: { usersDisliked: userId }, $inc: { dislikes: -1 } }
          )
          return res
            .status(httpStatus.OK)
            .json({ message: 'Your dislike has been removed' })
        } else {
          return res
            .status(httpStatus.OK)
            .json({ message: 'Your opinion is neutral' })
        }
      case 1:
        // the user hadn't liked or disliked so he wants to add a like
        if (!isLiked && !isDisliked) {
          await Sauces.updateOne(
            { _id: req.params.id },
            { $push: { usersLiked: userId }, $inc: { likes: 1 } }
          )
          return res
            .status(httpStatus.OK)
            .json({ message: 'You now like this sauce 🌶️ !' })
          // the user had disliked the sauce so we pull him from userDisliked, push him to userLiked and manage incrementation
        } else if (isDisliked) {
          await Sauces.updateOne(
            { _id: req.params.id },
            {
              $pull: { usersDisliked: userId },
              $inc: { dislikes: -1 },
              $push: { usersLiked: userId },
              $inc: { likes: 1 }
            }
          )
          return res
            .status(httpStatus.OK)
            .json({ message: 'Your opinion has been changed' })
        } else {
          return res
            .status(httpStatus.OK)
            .json({ message: 'You already like this sauce 🌶️ !' })
        }
      case -1:
        // user had liked the sauce so we pull him from userLiked, push him to userDisliked, and we manage incrementation
        if (isLiked) {
          await Sauces.updateOne(
            { _id: req.params.id },
            {
              $pull: { usersLiked: userId },
              $inc: { likes: -1 },
              $push: { usersDisliked: userId },
              $inc: { dislikes: 1 }
            }
          )
          return res
            .status(httpStatus.OK)
            .json({ message: 'You now dislike the sauce' })
          // if user had disliked the sauce, he cannot dislike anymore
        } else if (isDisliked) {
          return res
            .status(httpStatus.OK)
            .json({ message: 'You already disliked this sauce' })
          // user was neutral,so we push him in usersDisliked table and increment dislikes
        } else {
          await Sauces.updateOne(
            { _id: req.params.id },
            { $push: { usersDisliked: userId }, $inc: { dislikes: 1 } }
          )
          return res
            .status(httpStatus.OK)
            .json({ message: 'You dislike this sauce' })
        }
    }
  } catch (error) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error })
  }
}
