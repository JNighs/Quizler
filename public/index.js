let s, deck, user, quiz;

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

const App = {
    userSettings: {
        isLoggedIn: false,
        token: null,
        obj: null
    },

    init: function () {
        user = this.userSettings;
        this.bindUIActions();
        this.loginCheck();
        //TODO - Clean up login logic
        if (user.isLoggedIn) { this.showPage('decks'); }
    },

    bindUIActions: function () {
        $('.js-account-form').submit(e => {
            e.preventDefault();
            App.routeAccountForm(e);
        });

        $('.js-logout-button').click(e => {
            App.logout();
        });

        $('.js-decks-button').click(e => {
            App.showPage('decks');
        });
        //Show Create Deck form
        $('.js-toggle-create-deck-form').click(e => {
            $('.js-deck-form').toggleClass('showForm');
        });
        //Select deck and view its cards
        $('.js-decks-container').on("click", ".js-deck-select-button", function (e) {
            App.selectDeck(e);
        });
        //Changed inputs required depending on account form selection
        $('input[type=radio][name=rg]').change(e => {
            App.removeAccountError();
            App.accountFormRequiredFields(e);
        });

    },
    routeAccountForm: function (e) {
        //Find active search form
        const formType = $('input:checked').attr('id');
        if (formType === 'login') {
            App.formLogin(e);
        } else if (formType === 'create') {
            App.verifyAccountCreation(e);
        }

        //Clear password text fields
        $('input').not('.js-account-username').val("");
    },
    //Modify element properties when swtiching between Login and Create forms
    accountFormRequiredFields: function (e) {
        _this = e.currentTarget;
        //Remove ability to tab to all forms
        $('.login, .create').each(function () { $(this).prop('tabindex', -1) });
        //Remove all previous required inputs
        $('input[required]').each(function () { $(this).prop('required', false) });
        //Remove binding from password requirements
        $('.js-account-password').off();
        //Add in required inputs based on form
        if (_this.id == 'login') {
            $(".js-account-username").prop('required', true);
            $(".js-account-password").prop('required', true);
            $('.login').each(function () { $(this).prop('tabindex', 0) });
        }
        else if (_this.id == 'create') {
            $(".js-account-username").prop('required', true);
            $(".js-account-password").prop('required', true);
            $(".js-account-verify").prop('required', true);
            $('.create').each(function () { $(this).prop('tabindex', 0) });

            App.bindPasswordRequirements();
        }
    },
    //Shows password requirements when password field is focused
    bindPasswordRequirements: function () {
        const $field = $('.js-password-requirements');
        $('.js-account-password').focusin(function () {
            //$field.text("Password must be at least 8 characters");
            $field.addClass('showAlert');
        }).blur(function () {
            $field.removeClass('showAlert');
            //$field.empty();
        })
    },
    //If user is already logged in, set header and grab user object
    loginCheck: function () {
        if (localStorage.token) {
            user.isLoggedIn = true;
            Ajax.setHeader();
            Ajax.userData();
        }
    },
    //Verify username and password fields for account creation
    verifyAccountCreation: function (e) {
        $this = $(e.currentTarget);
        const username = $this.find('.js-account-username').val();
        const password = $this.find('.js-account-password').val();
        const verify = $this.find('.js-account-verify').val();

        //Empty password fields
        $this.find('.js-account-password').val('');
        $this.find('.js-account-verify').val('');

        //Check if password is at least 8 characters long
        if (password.length < 8) {
            App.accountError('Password needs to be at least 8 characters long');
        }
        //Check for whitespace
        else if (username.trim() !== username || password.trim() !== password) {
            App.accountError('Fields cannot start or end with whitespace');
        }
        //Check if password and verification are the same
        else if (password !== verify) {
            App.accountError('Passwords do not match');
        }
        //Create account
        else {
            App.removeAccountError();
            App.createAccount(username, password);
        }
    },
    //Shows error string for account form
    accountError: function (string = 'An error has occured') {
        const $error = $('.js-create-account-error');
        $error.addClass('showAlert');
        $error.text(string);
    },
    //Hides error element for account form
    removeAccountError: function () {
        $('.js-create-account-error').removeClass('showAlert');
    },
    //Create account then log into it
    createAccount: function (username, password) {
        Ajax.createAccount(username, password)
            .then(() => {
                App.login(username, password)
            });
    },
    //Login and show user's deck page
    login: function (username, password) {
        Ajax.login(username, password)
            .then(data => {
                //TODO - Clean up login logic
                localStorage.token = data.authToken;
                App.loginCheck();
                App.showPage('decks');
            })
    },
    //Login from login form
    formLogin: function (e) {
        $this = $(e.currentTarget);
        const username = $this.find('.js-account-username').val();
        const password = $this.find('.js-account-password').val();
        App.login(username, password);
    },

    logout: function () {
        localStorage.clear();
        App.showPage('login');
    },
    //Go to selected Deck's cards page
    selectDeck: function (e) {
        const selected = e.currentTarget.dataset.index;
        deck.currentDeck = deck.deckList[selected];
        App.showPage('cards');
    },
    //Shows input page, hides rest
    showPage: function (inputPage) {
        const pages = ['login', 'decks', 'cards', 'quiz', 'score'];
        //Compare input page to available pages, show input page, hide the rest
        pages.forEach(page => {
            if (inputPage === page) {
                $(`.js-${page}-page`).show();
            } else $(`.js-${page}-page`).hide();
        })
        App.render.page(inputPage);
    },

    render: {
        page: function (inputPage) {
            switch (inputPage) {
                case 'login':
                    $('.js-logout-button').hide();
                    App.removeAccountError();
                    break;
                case 'decks':
                    $('.js-deck-form').removeClass('showForm');
                    $('.js-logout-button').show();
                    Ajax.deckList().then(App.render.decks);
                    break;
                case 'cards':
                    App.render.cards();
                    break;
            }
        },
        decks: function (data) {
            const $deckContainer = $('.js-decks-container');
            //Reverse so that the newest deck is at front
            deck.deckList = data.reverse();
            //Populate decks list
            $deckContainer.empty();
            deck.deckList.forEach((deck, index) => {
                const $deck = $('<div class="deck-container"></div>');
                $deckContainer.append($deck);
                App.render.deckCardStack($deck, deck.title, deck.cards, index);
            });
            //Show page
            $('.js-decks-page').show();
        },
        //Renders the visual deck stack
        deckCardStack: function ($deck, title, cards, deckIndex) {
            //deckMax based on how many cards before it doesn't fit in the container
            const deckMax = 48;
            let deckLength = cards.length;
            let deckThickness;

            //Calculate deck thickness 
            //(magic numbers based on when decks clip the div block)
            if (cards.length < 12) {
                deckThickness = 4;
            } else if (cards.length < 16) {
                deckThickness = 3;
            } else if (cards.length < 24) {
                deckThickness = 2;
            } else {
                deckThickness = 1;
            }
            //Render deck's cards
            cards.forEach((card, index) => {
                //Stop rendering at deckMax
                if (index >= deckMax) return;
                App.render.deckCard($deck, index, deckThickness, card.level);
            });
            //Need to know if deck was capped in order to place the top card
            if (deckLength >= deckMax) { deckLength = deckMax };
            //Render front card
            const $frontCard = App.render.deckCard($deck, deckLength, deckThickness);
            $frontCard.append(App.render.frontCard(title, deckIndex));
        },
        //Renders the cards within the deck stack
        deckCard: function ($deck, index, deckThickness, cardLevel) {
            const $elem = $('<div class="deck-card"></div>');
            const offset = index * deckThickness;
            $deck.append($elem);
            $elem.css({
                "bottom": offset,
                "right": offset,
                "z-index": index
            });
            if (cardLevel === 0) {
                $elem.css({
                    "background": "#05668D",
                    "box-shadow": "2px 2px #055474"
                });
            }
            else if (cardLevel === 1) {
                $elem.css({
                    "background": "#028090",
                    "box-shadow": "2px 2px #026976"
                });
            }
            else if (cardLevel === 2) {
                $elem.css({
                    "background": "#00A896",
                    "box-shadow": "2px 2px #008A7B"
                });
            }
            else if (cardLevel === 3) {
                $elem.css({
                    "background": "#02C39A",
                    "box-shadow": "2px 2px #02A07F"
                });
            }
            //Return element for futher modification (front card info)
            return $elem;
        },
        //Renders the front card of the deck (shows deck title and buttons)
        frontCard: function (title, deckIndex) {
            return `
                <h2>${title}</h2>
                <div class="card-buttons-container">
                    <button type="button" class="js-deck-select-button" data-index="${deckIndex}">Select</button>
                    <button type="button" class="js-deck-edit-button" data-index="${deckIndex}">Edit</button>
                    <button type="button" class="js-deck-delete-button" data-index="${deckIndex}">Delete</button>
                </div>
            `;
        },
        cards: function () {
            const cardList = deck.currentDeck.cards;
            const $list = $('.js-cards-list');
            $list.empty();
            if (!cardList.empty) {
                cardList.forEach((card, index) => {
                    $list.append(`
                    <div class="js-card-container">
                        <div class="row">
                            <div class="column">
                                <h3>${card.question}</h3>
                                <button type="button" class="js-card-edit-question-button" data-index="${index}">Edit</button>
                            </div>
                            <div class="column">
                                <h3>${card.answer}</h3>
                                <button type="button" class="js-card-edit-answer-button" data-index="${index}">Edit</button>
                            </div>
                        </div>
                        <button type="button" class="js-card-delete-button" data-index="${index}">Delete</button>
                    </div>
            `);
                });
            }
        }
    },
};

const Deck = {
    settings: {
        deckList: null,
        currentDeck: null,
        currentCard: null,
    },
    init: function () {
        deck = this.settings;
        this.bindUIActions();
    },
    bindUIActions: function () {
        //Create new deck
        $('.js-deck-form').submit(e => {
            e.preventDefault();
            Deck.createDeck(e);
        });
        //Create new card
        $('.js-card-form').submit(e => {
            e.preventDefault();
            Deck.createCard(e);
        });
        //Edit deck
        $('.js-decks-container').on("click", ".js-deck-edit-button", function (e) {
            Deck.editDeck(e);
        });
        //Edit card question
        $('.js-cards-list').on("click", ".js-card-edit-question-button", function (e) {
            Deck.editCard(e, "question");
        });
        //Edit card answer
        $('.js-cards-list').on("click", ".js-card-edit-answer-button", function (e) {
            Deck.editCard(e, "answer");
        });
        //Delete deck
        $('.js-decks-container').on("click", ".js-deck-delete-button", function (e) {
            Deck.deleteDeck(e);
        });
        //Delete card
        $('.js-cards-list').on("click", ".js-card-delete-button", function (e) {
            Deck.deleteCard(e);
        });
    },
    createDeck: function (e) {
        const deckTitle = $(e.currentTarget).find('.js-new-deck').val();
        //Create deck then reload decks page
        Ajax.createDeck(deckTitle)
            .then(App.showPage('decks'));
    },
    createCard: function (e) {
        const $this = $(e.currentTarget);
        const cardQuestion = $this.find('.js-new-card-question').val();
        const cardAnswer = $this.find('.js-new-card-answer').val();
        //Add card to deck then reload cards page
        Ajax.createCard(deck.currentDeck._id, cardQuestion, cardAnswer)
            .then(() => {
                //Retrieve updated deck
                return Ajax.deckByID(deck.currentDeck._id);
            })
            .then((data) => {
                //Show updated cards
                deck.currentDeck = data;
                App.showPage('cards');
            });
    },
    editDeck: function (e) {
        const selected = e.currentTarget.dataset.index;
        const deckID = deck.deckList[selected]._id;
        const $deckTitle = $(e.currentTarget).parent().siblings('h2');
        const currentTitle = $deckTitle.text();

        //Make title editable text, focus it
        $deckTitle.prop('contentEditable', true).focus()
            //On deselecting text, write new name into database
            .on('blur', function () {
                const newTitle = $deckTitle.text().trim();
                if (newTitle !== currentTitle) {
                    Ajax.updateDeck(deckID, newTitle);
                }
                //Reset text field value to remove whitespace
                $deckTitle.text(newTitle);
                $deckTitle.prop('contentEditable', false);
            });
    },
    editCard: function (e, cardSide) {
        const index = e.currentTarget.dataset.index;
        const _deck = deck.currentDeck;
        const _card = _deck.cards[index];
        const $cardText = $(e.currentTarget).siblings('h3');
        let currentText;
        if (cardSide === "question") {
            currentText = _card.question;
        } else { currentText = _card.answer };

        $cardText.prop('contentEditable', true).focus()
            //On deselecting text, write new name into database
            .on('blur', function () {
                const newText = $cardText.text()
                if (newText !== currentText) {
                    console.log(newText);
                    Ajax.updateCard(_deck._id, _card._id, cardSide, newText)
                }
                $cardText.prop('contentEditable', false);
            });


    },
    deleteDeck: function (e) {
        const index = e.currentTarget.dataset.index;
        const _deck = deck.deckList[index];
        Ajax.deleteDeck(_deck._id)
            .then(App.showPage('decks'));
    },
    deleteCard: function (e) {
        const index = e.currentTarget.dataset.index;
        const _deck = deck.currentDeck;
        const _card = _deck.cards[index];
        Ajax.deleteCard(_deck._id, _card._id)
            .then(() => {
                return Ajax.deckByID(_deck._id);
            })
            .then(updatedDeck => {
                deck.currentDeck = updatedDeck;
                App.showPage('cards');
            });
    },
}

const Quiz = {
    settings: {
        card: 0,
        score: 0
    },

    init: function () {
        quiz = this.settings;
        this.bindUIActions();
    },

    bindUIActions: function () {
        $('.js-start-quiz-button').click(function () {
            App.showPage('quiz');
            Quiz.renderCard();
        });

        $('.js-reset-button').click(function () {
            Quiz.resetQuiz();
        });

        $('.js-flip-button').click(function () {
            Quiz.flipCard();
        });

        $('.js-correct-button').click(function () {
            Quiz.changeCardScore(true);
            quiz.score++;
            Quiz.changeCard();
        });

        $('.js-incorrect-button').click(function () {
            Quiz.changeCardScore(false);
            Quiz.changeCard();
        });
    },

    renderCard: function () {
        deck.currentCard = deck.currentDeck.cards[quiz.card];
        $('.js-card-text').html(`
            <div class="card-question">${deck.currentCard.question}</div>
            <div class="card-answer" hidden>${deck.currentCard.answer}</div>
        `);
    },

    flipCard: function () {
        $('.card-question').toggle();
        $('.card-answer').toggle();
    },

    changeCard: function () {
        quiz.card++;
        if (quiz.card != deck.currentDeck.cards.length)
            Quiz.renderCard(quiz.card);
        else {
            Quiz.showScore();
        }

    },

    changeCardScore: function (increase) {
        const deckID = deck.currentDeck._id;
        const cardID = deck.currentDeck.cards[quiz.card]._id;
        if (increase) {
            Ajax.updateCardValue(deckID, cardID, true);
        } else {
            Ajax.updateCardValue(deckID, cardID, false);
        }
    },

    showScore: function () {
        App.showPage('score');
        $('.js-score-container').html(`
            <div class="score">Your Score: ${quiz.score}/${deck.currentDeck.cards.length}</div>
        `);
    },

    resetQuiz: function () {
        quiz.card = 0;
        quiz.score = 0;
        App.showPage('cards');
    }
}

function onLoad() {
    App.init();
    Deck.init();
    Quiz.init();
}

$(onLoad);