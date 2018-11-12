'use strict';
const express = require('express');
const passport = require('passport');
const { Deck } = require('./models');

const router = express.Router();

const jwtAuth = passport.authenticate('jwt', { session: false });

//Get all decks from user
router.get("/", jwtAuth, (req, res) => {
    Deck.find({ "uid": req.user.id }).limit(10)
        .then(decks => {
            res.json({
                decks: decks
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: "Internal server error" });
        });
});
//Get deck by id
router.get("/:id", jwtAuth, (req, res) => {
    Deck.findById(req.params.id)
        .then(deck => res.json(deck))
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: "Internal server error" });
        });
});
//Create deck
router.post("/", jwtAuth, (req, res) => {
    if (!("title" in req.body)) {
        const message = 'Missing title in request body';
        console.error(message);
        return res.status(400).send(message);
    }

    Deck.create({
        uid: req.body.uid,
        title: req.body.title
    })
        .then(deck => res.status(201).json(deck))
        .catch(err => {
            console.log(err);
            res.status(500).json({ message: "Internal server error" });
        });
});
//Update deck (new title or new card)
router.put("/:id", jwtAuth, (req, res) => {
    if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
        const message =
            `Request path id (${req.params.id}) and request body id ` +
            `(${req.body.id}) must match`;
        console.error(message);
        return res.status(400).json({ message: message });
    }
    const toUpdate = {};
    if ('title' in req.body) {
        toUpdate['$set'] = { "title": req.body.title };
    }

    if ('card' in req.body) {
        toUpdate['$push'] = { "cards": req.body.card };
    }
    Deck.findByIdAndUpdate(req.body.id, toUpdate)
        .then(deck => res.status(204).end())
        .catch(err => res.status(500).json({ message: "Internal server error" }));
});
//Update card (question or answer)
router.put("/:id/cards/:cardID", jwtAuth, (req, res) => {
    //updates either the question or answer depending on req.body.cardSide
    const update = {}
    const key = 'cards.$.' + req.body.cardSide;
    update[key] = req.body.text;
    Deck.findOneAndUpdate({ 'cards._id': req.params.cardID }, update)
        .then(deck => res.status(204).end())
        .catch(err => res.status(500).json({ message: "Internal server error" }));
});
//Deletes card within deck
router.delete("/:id/cards/:cardID", jwtAuth, (req, res) => {
    const toDelete = {
        $pull: { cards: { _id: req.params.cardID } }
    };

    Deck.findByIdAndUpdate(req.params.id, toDelete)
        .then(deck => res.status(204).end())
        .catch(err => res.status(500).json({ message: "Internal server error" }));
});
//Deletes deck
router.delete("/:id", jwtAuth, (req, res) => {
    Deck.findByIdAndRemove(req.params.id)
        .then(deck => res.status(204).end())
        .catch(err => res.status(500).json({ message: "Internal server error" }));
});

module.exports = { router };