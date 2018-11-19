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
            res.json(decks);
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
    //Create deck with cards already in it (used for testing mostly)
    let cards = [];
    if ("cards" in req.body) {
        cards = req.body.cards
    }

    Deck.create({
        uid: req.body.uid,
        title: req.body.title,
        cards: cards
    })
        .then(deck => res.status(201).json(deck))
        .catch(err => {
            console.log(err);
            res.status(500).json({ message: "Internal server error" });
        });
});
//Create card
router.post("/:id", jwtAuth, (req, res) => {
    //TODO - Verify there's a question and answer in the res.body
    const update = {};
    update['$push'] = { "cards": req.body };
    Deck.findByIdAndUpdate(req.params.id, update)
        .then(deck => res.status(204).end())
        .catch(err => res.status(500).json({ message: "Internal server error" }));
});
//Update deck (new title)
router.put("/:id", jwtAuth, (req, res) => {
    if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
        const message =
            `Request path id (${req.params.id}) and request body id ` +
            `(${req.body.id}) must match`;
        console.error(message);
        return res.status(400).json({ message: message });
    }
    //TODO - verify there's a title in the res.body
    const update = {};
    if ('title' in req.body) {
        update['$set'] = { "title": req.body.title };
    }

    Deck.findByIdAndUpdate(req.body.id, update)
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
//Update card's level
router.put("/:id/cards/:cardID/level", jwtAuth, (req, res) => {
    Deck.findOne({ 'cards._id': req.params.cardID })
        .then(deck => {
            const card = deck.cards.id(req.params.cardID);
            card.changeLevel(req.body.increase);
            deck.save();
            res.status(204).end();
        })
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