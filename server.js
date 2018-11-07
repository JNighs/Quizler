'use strict'
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');

const app = express();

mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL } = require('./config');
const { Deck } = require('./models');

app.use(express.json());
app.use(morgan('common'));
app.use(express.static("public"));

app.get("/decks", (req, res) => {
    Deck.find().limit(10)
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

app.post("/decks", (req, res) => {
    if (!("title" in req.body)) {
        const message = 'Missing title in request body';
        console.error(message);
        return res.status(400).send(message);
    }

    Deck.create({
        title: req.body.title
    })
        .then(deck => res.status(201).json(deck))
        .catch(err => {
            console.log(err);
            res.status(500).json({ message: "Internal server error" });
        });
});

//Page not found
app.use('*', (req, res) => {
    return res.status(404).json({ message: 'Not Found' });
});

/*   Server Start and Close   */

let server;

function runServer() {
    mongoose.set('debug', true);
    return new Promise((resolve, reject) => {
        mongoose.connect(DATABASE_URL, err => {
            if (err) { return reject(err); }
            server = app
                .listen(PORT, () => {
                    console.log(`Listening on ${PORT}`);
                    resolve();
                })
                .on('error', err => {
                    mongoose.disconnect();
                    reject(err);
                });
        });
    });
}

function closeServer() {
    return mongoose.disconnect().then(() => {
        return new Promise((resolve, reject) => {
            console.log('Closing server');
            server.close(err => {
                if (err) { return reject(err) }
            });
        });
    });
}

if (require.main === module) {
    runServer(DATABASE_URL).catch(err => console.error(err));
}


module.exports = { app, runServer, closeServer };

/*
require('dotenv').config();
const passport = require('passport');

const { router: usersRouter } = require('./users');
const { router: authRouter, localStrategy, jwtStrategy } = require('./auth');

passport.use(localStrategy);
passport.use(jwtStrategy);

app.use('/api/users/', usersRouter);
app.use('/api/auth/', authRouter);

const jwtAuth = passport.authenticate('jwt', { session: false });

app.get('/api/protected', jwtAuth, (req, res) => {
    return res.json({ data: 'rosebud' });
});

*/