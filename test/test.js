'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const { Deck } = require('../decks/models');
const { User } = require('../users');
const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL } = require('../config');

chai.use(chaiHttp);

function createUser() {
    return {
        "username": faker.internet.userName(),
        "password": faker.internet.password(),
    }
}

function seedDeckData(uid) {
    console.info('Seeding deck data');
    const deckData = [];

    for (let i = 1; i <= 10; i++) {
        deckData.push(generateDeckData(uid));
    }

    return Deck.insertMany(deckData);
}

function generateCardData() {
    return {
        question: faker.lorem.words(),
        answer: faker.lorem.words()
    }
}

function generateDeckData(uid) {
    return {
        uid: uid,
        title: faker.lorem.words(),
        cards: [
            generateCardData(),
            generateCardData(),
            generateCardData(),
            generateCardData(),
            generateCardData(),
        ]
    }
}

function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
}

/*          Tests            */

describe('User API', function () {
    let user, login, token;

    before(function () {
        return runServer(TEST_DATABASE_URL);
    });

    after(function () {
        return tearDownDb();
    });

    describe('/api/users/ POST endpoint', function () {
        it('should create and return a new user', function () {
            user = createUser();
            login = {
                username: user.username,
                password: user.password
            }
            return chai.request(app)
                .post('/api/users')
                .send(user)
                .then(function (res) {
                    expect(res).to.have.status(201);
                    expect(res).to.be.json;
                    expect(res).to.be.an('object');
                    expect(res.body).to.include.keys('username');
                    expect(res.body.id).to.not.be.null;
                    expect(res.body.username).to.equal(user.username);

                    return User.findById(res.body.id);
                })
                .then(function (user) {
                    expect(user.username).to.equal(user.username);
                });
        });
    });

    describe('/api/auth/login POST endpoint', function () {
        it('should return a new JWT token', function () {
            return chai.request(app)
                .post('/api/auth/login')
                .send(login)
                .then(function (res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res).to.be.an('object');
                    expect(res.body).to.include.keys('authToken');
                    token = 'Bearer ' + res.body.authToken;
                });
        });

        it('token should be valid and return a user', function () {
            return chai.request(app)
                .get('/userdata')
                .set('Authorization', token)
                .then(function (res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res).to.be.an('object');
                    expect(res.body).to.include.keys('user')
                    expect(res.body.user).to.include.keys('username');
                    expect(res.body.user.id).to.not.be.null;
                    expect(res.body.user.username).to.equal(user.username);
                });
        });
    });

    describe('/api/auth/refresh POST endpoint', function () {
        it('should return a new JWT token', function () {
            return chai.request(app)
                .post('/api/auth/refresh')
                .set('Authorization', token)
                .then(function (res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res).to.be.an('object');
                    expect(res.body).to.include.keys('authToken');
                })
        });
    });
});

describe('Decks API resource', function () {
    let token, uid;

    beforeEach(function () {
        console.info('Creating User and token')
        const user = createUser();
        const login = {
            username: user.username,
            password: user.password
        }
        return chai.request(app)
            .post('/api/users')
            .send(user)
            .then(function (res) {
                uid = res.body.id;
                return chai.request(app)
                    .post('/api/auth/login')
                    .send(login)
            })
            .then(function (res) {
                token = 'Bearer ' + res.body.authToken;
                return seedDeckData(uid);
            })
    });

    afterEach(function () {
        return tearDownDb();
    });

    after(function () {
        return closeServer();
    });

    describe('/decks GET endpoint', function () {
        it('should return all existing user decks', function () {
            let res;
            return chai.request(app)
                .get('/decks')
                .set('Authorization', token)
                .then(function (_res) {
                    res = _res;
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.lengthOf.at.least(1);
                    return Deck.countDocuments();
                })
                .then(function (count) {
                    expect(res.body).to.have.lengthOf(count);
                })
        });

        it('should return decks with the right fields', function () {
            let resDeck;
            return chai.request(app)
                .get('/decks')
                .set('Authorization', token)
                .then(function (res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('array');
                    expect(res.body).to.have.lengthOf.at.least(1);

                    res.body.forEach(function (deck) {
                        expect(deck).to.be.a('object');
                        expect(deck).to.include.keys(
                            'uid', 'title', 'cards'
                        )
                    });
                    resDeck = res.body[0];
                    return Deck.findById(resDeck._id);
                })
                .then(function (deck) {
                    expect(resDeck._id).to.equal(deck.id);
                    expect(resDeck.uid).to.equal(deck.uid.toString());
                    expect(resDeck.title).to.equal(deck.title);
                    resDeck.cards.forEach((card, i) => {
                        expect(card.question).to.equal(deck.cards[i].question);
                        expect(card.answer).to.equal(deck.cards[i].answer);
                    });
                })
        });
    });

    describe('/decks POST endpoint', function () {
        it('should add a new deck', function () {
            const newDeck = generateDeckData(uid);
            return chai.request(app)
                .post('/decks')
                .set('Authorization', token)
                .send(newDeck)
                .then(function (res) {
                    expect(res).to.have.status(201);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body).to.include.keys(
                        'uid', 'title', 'cards');
                    expect(res.body.id).to.not.be.null;
                    expect(res.body.title).to.equal(newDeck.title);
                    res.body.cards.forEach((card, i) => {
                        expect(card.question).to.equal(newDeck.cards[i].question);
                        expect(card.answer).to.equal(newDeck.cards[i].answer);
                    });

                    return Deck.findById(res.body._id);
                })
                .then(function (deck) {
                    expect(newDeck.uid).to.equal(deck.uid.toString());
                    expect(newDeck.title).to.equal(deck.title);
                    deck.cards.forEach((card, i) => {
                        expect(card.question).to.equal(deck.cards[i].question);
                        expect(card.answer).to.equal(deck.cards[i].answer);
                    });
                });
        });
    });

    describe('/decks/:id POST endpoint', function () {
        it('should add a new card', function () {
            let deckID, cardsLength;
            const newCard = generateCardData();
            return Deck
                .findOne()
                .set('Authorization', token)
                .then(function (deck) {
                    deckID = deck.id;
                    cardsLength = deck.cards.length;
                    return chai.request(app)
                        .post('/decks/' + deckID)
                        .set('Authorization', token)
                        .send(newCard);
                })
                .then(function (res) {
                    expect(res).to.have.status(204);
                    return Deck.findById(deckID);
                })
                .then(function (deck) {
                    //Grabs the last card (the one just added)
                    const card = deck.cards[cardsLength];
                    expect(card.question).to.equal(newCard.question);
                    expect(card.answer).to.equal(newCard.answer);
                });
        });
    });

    describe('/decks/:id PUT endpoint', function () {
        it('should update fields you send over', function () {
            const updateData = {
                title: 'Updated Title',
            }

            return Deck
                .findOne()
                .then(function (deck) {
                    updateData.id = deck.id;
                    return chai.request(app)
                        .put('/decks/' + updateData.id)
                        .set('Authorization', token)
                        .send(updateData);
                })
                .then(function (res) {
                    expect(res).to.have.status(204);
                    return Deck.findById(updateData.id);
                })
                .then(function (deck) {
                    expect(deck.title).to.equal(updateData.title);
                });
        });
    });

    describe('/decks/:id DELETE endpoint', function () {
        it('delete a deck by id', function () {
            let deck;
            return Deck
                .findOne()
                .then(function (_deck) {
                    deck = _deck;
                    return chai.request(app)
                        .delete(`/decks/${deck.id}`)
                        .set('Authorization', token);
                })
                .then(function (res) {
                    expect(res).to.have.status(204);
                    return Deck.findById(deck.id);
                })
                .then(function (_deck) {
                    expect(_deck).to.be.null;
                });
        });
    });

    describe('decks/:id/cards/:cardID DELETE endpoint', function () {
        it('delete a card by id', function () {
            let deck, card;
            return Deck
                .findOne()
                .then(function (_deck) {
                    deck = _deck;
                    card = deck.cards[0].id;
                    return chai.request(app)
                        .delete(`/decks/${deck.id}/cards/${card}`)
                        .set('Authorization', token);
                })
                .then(function (res) {
                    expect(res).to.have.status(204);
                    return Deck.findById(deck.id);
                })
                .then(function (_deck) {
                    _deck.cards.forEach(_card => {
                        expect(_card.id).to.not.equal(card.id);
                    })
                });
        });
    });
    
});