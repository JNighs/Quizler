'use strict'
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const passport = require('passport');

require('dotenv').config();
const app = express();

mongoose.Promise = global.Promise;

const { router: usersRouter } = require('./users');
const { router: authRouter, localStrategy, jwtStrategy } = require('./auth');
const { PORT, DATABASE_URL } = require('./config');
const { router: decksRouter, Deck } = require('./decks');

app.use(express.json());
app.use(morgan('common'));
app.use(express.static("public"));
app.use('/api/users/', usersRouter);
app.use('/api/auth/', authRouter);
app.use('/decks/', decksRouter);

passport.use(localStrategy);
passport.use(jwtStrategy);

const jwtAuth = passport.authenticate('jwt', { session: false });

app.get("/userdata", jwtAuth, (req, res) => {
    res.json({ user: req.user });
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