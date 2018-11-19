"use strict";

const mongoose = require("mongoose");

const cardSchema = mongoose.Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
    level: { type: Number, default: 1 },
});

cardSchema.methods.changeLevel = function (increase) {
    if (increase && this.level !== 3) {
        this.level++;
    } else if (!increase && this.level !== 0) {
        this.level--;
    }
}

const deckSchema = mongoose.Schema({
    uid: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    cards: [cardSchema]
});

const Deck = mongoose.model('Deck', deckSchema);

module.exports = { Deck };