"use strict";

const mongoose = require("mongoose");

const cardSchema = mongoose.Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true }
});

const deckSchema = mongoose.Schema({
    title: { type: String, required: true },
    cards: [cardSchema]
});

deckSchema.virtual("length").get(function () {
    return this.cards.length;
});

const Deck = mongoose.model('Deck', deckSchema);

module.exports = { Deck };