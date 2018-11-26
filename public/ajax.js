const Ajax = {
    setHeader: function () {
        $.ajaxSetup({
            beforeSend: function (xhr) {
                if (localStorage.token) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.token);
                }
            }
        });
    },
    createAccount(username, password) {
        const data = JSON.stringify({ username: username, password: password });
        return $.ajax({
            url: './api/users/',
            type: 'POST',
            data: data,
            contentType: 'application/json',
            error: function (xhr) {
                const err = jQuery.parseJSON(xhr.responseText);
                App.accountError(err.message);
            }
        })
    },
    login(username, password) {
        const data = JSON.stringify({ username: username, password: password });
        return $.ajax({
            url: './api/auth/login',
            type: 'POST',
            data: data,
            contentType: 'application/json',
            error: function (xhr) {
                const err = jQuery.parseJSON(xhr.responseText);
                App.accountError(err.message);
            }
        });
    },
    userData() {
        $.ajax({
            url: './api/users/userdata',
            type: 'GET',
            success: function (data) {
                App.user = data.user;
            },

        })
    },
    deckList() {
        return $.getJSON('./decks');
    },
    deckByID(id) {
        return $.getJSON(`./decks/${id}`);
    },
    createDeck(title) {
        const data = JSON.stringify({ uid: App.user.id, title: title });
        return $.ajax({
            url: './decks',
            type: 'POST',
            data: data,
            contentType: 'application/json',
        });
    },
    createCard(_id, question, answer) {
        const cardData = JSON.stringify({
            question: question,
            answer: answer
        });
        return $.ajax({
            url: `./decks/${_id}`,
            type: 'POST',
            data: cardData,
            contentType: 'application/json'
        });
    },
    //TODO - Organize PUT request
    updateDeck(_id, _title) {
        const updateData = JSON.stringify({
            id: _id,
            title: _title
        });
        return $.ajax({
            url: `./decks/${_id}`,
            type: 'PUT',
            data: updateData,
            contentType: 'application/json'
        });
    },
    updateCard(deckID, cardID, cardSide, newText) {
        const updateData = {
            cardSide: cardSide,
            text: newText
        }
        return $.ajax({
            url: `./decks/${deckID}/cards/${cardID}`,
            type: 'PUT',
            data: JSON.stringify(updateData),
            contentType: 'application/json'
        });
    },
    deleteDeck(id) {
        return $.ajax({
            url: `./decks/${id}`,
            type: 'DELETE'
        });
    },
    deleteCard(deckID, cardID) {
        return $.ajax({
            url: `./decks/${deckID}/cards/${cardID}`,
            type: 'DELETE',
            contentType: 'application/json'
        });
    },
    updateCardValue(deckID, cardID, increase) {
        return $.ajax({
            url: `./decks/${deckID}/cards/${cardID}/level`,
            type: 'PUT',
            data: JSON.stringify({ increase: increase }),
            contentType: 'application/json'
        });
    },
}