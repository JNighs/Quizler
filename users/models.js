'use strict';
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const UserSchema = mongoose.Schema({
    //case insenstive unique username
    uniqueUsername: {
        type: String,
        required: true,
        lowercase: true,
        unique: true
    },
    //original user typed case-sensitive name
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

UserSchema.methods.serialize = function () {
    return {
        id: this._id,
        username: this.username || ''
    }
};

UserSchema.methods.validatePassword = function (password) {
    return bcrypt.compare(password, this.password);
};

UserSchema.statics.hashPassword = function (password) {
    return bcrypt.hash(password, 10);
};

const User = mongoose.model('User', UserSchema);

module.exports = { User };