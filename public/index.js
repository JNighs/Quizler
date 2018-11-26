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
        //Button for card page > deck page
        $('.js-decks-button').click(e => {
            App.showPage('decks');
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
        //Flip card over
        $('.js-cards-list').on("click", ".js-card-flip", function (e) {
            Deck.flipCard(e);
        });
        //Binds arrow keys for easy carousel movement
        $(document).keydown(function (e) {
            if (!$(e.target).is('input') && Slick.active) {
                switch (e.which) {
                    case 37: // left
                        Slick.prev();
                        break;
                    case 39: // right
                        Slick.next();
                        break;
                    default: return; // exit this handler for other keys
                }
                e.preventDefault();
            }
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
        Slick.destroy(Slick.decks);
        App.showPage('login');
    },
    //Go to selected Deck's cards page
    selectDeck: function (e) {
        const selected = e.currentTarget.dataset.index;
        Slick.deckFocus = selected;
        deck.currentDeck = deck.deckList[selected];
        App.showPage('cards');
    },
    //Show form (this code is a bit of a mess)
    showForm: function (form, action) {
        if (form === 'deck') {
            const $nameField = $('.js-new-deck');
            const $submit = $('.new-deck-submit');
            const array = [$nameField, $submit];
            App.modifyForm(form, action, array);
        } else if (form === 'card') {
            const $question = $('.js-new-card-question');
            const $answer = $('.js-new-card-answer');
            const $submit = $('.new-card-submit');
            const array = [$question, $answer, $submit];
            App.modifyForm(form, action, array);
        }
    },
    //used for showForm() element modifications
    modifyForm: function (form, action, array) {
        if (action === 'toggle') {
            array.forEach($elem => {
                App.toggleTabindex($elem);
                $elem.toggleClass('showField');
            });
            $(`.js-${form}-form`).toggleClass('showForm');
        } else if (action === 'off') {
            array.forEach($elem => {
                $elem.prop('tabindex', -1);
                $elem.removeClass('showField');
            });
            $(`.js-${form}-form`).removeClass('showForm');
        }
    },
    //Toggle tabindex for an element
    toggleTabindex: function ($elem) {
        $elem.prop('tabindex', $($elem).prop('tabindex') === 0 ? -1 : 0);
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
                    App.showForm('deck', 'off');
                    $('.js-logout-button').show();
                    Ajax.deckList().then(App.render.decks);
                    Slick.active = Slick.decks;
                    break;
                case 'cards':
                    App.showForm('card', 'off');
                    if (deck.currentDeck.cards.length === 0) {
                        $('.js-start-quiz-button').hide();
                    } else { $('.js-start-quiz-button').show(); }
                    App.render.cards();
                    Slick.active = Slick.cards;
                    break;
            }
        },
        decks: function (data) {
            const $deckContainer = $('.js-decks-container');
            //Reset container
            Slick.destroy(Slick.decks);
            $deckContainer.empty();
            //Reverse so that the newest deck is at front
            deck.deckList = data.reverse();
            //Populate decks list
            deck.deckList.forEach((deck, index) => {
                const $deck = $('<div class="deck-container"></div>');
                $deckContainer.append($deck);
                App.render.deckCardStack($deck, deck.title, deck.cards, index);
            });
            //Run slick carousel
            Slick.run(Slick.decks, Slick.deckFocus);
            //Focus on last slide
            Slick.goTo(Slick.decks, Slick.deckFocus, true);
            //Show page
            $('.js-decks-page').show();
        },
        //Renders the visual deck stack
        deckCardStack: function ($deck, title, cards, deckIndex) {
            //deckMax based on how many cards before it doesn't fit in the container
            const deckMax = 40;
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
            const centerOffset = 25;
            const offset = index * deckThickness;
            $deck.append($elem);
            $elem.css({
                "bottom": offset,
                "right": offset + centerOffset,
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
                <div class="card-buttons-container" hidden>
                    <button type="button" class="js-deck-select-button focusButton" data-index="${deckIndex}">Select</button>
                    <button type="button" class="js-deck-edit-button" data-index="${deckIndex}">Edit</button>
                    <button type="button" class="js-deck-delete-button" data-index="${deckIndex}">Delete</button>
                </div>
            `;
        },
        //TODO - Remove global currentDeck and replace with passed variable
        cards: function () {
            const cardList = deck.currentDeck.cards.reverse();
            const $list = $('.js-cards-list');
            //Reset container
            Slick.destroy(Slick.cards);
            $list.empty();
            if (!cardList.empty) {
                cardList.forEach((card, index) => {
                    $list.append(`
                    <div class="js-card-container">
                        <div class="flipper">
                            <div class="front">
                                <h3>${card.question}</h3>
                                <div class="card-buttons-container" hidden>    
                                    <button type="button" class="js-card-flip focusButton">Flip</button>
                                    <button type="button" class="js-card-edit-question-button" data-index="${index}">Edit</button>
                                    <button type="button" class="js-card-delete-button" data-index="${index}">Delete</button>
                                </div>
                            </div>
                            <div class="back">
                                <h3>${card.answer}</h3>
                                <div class="card-buttons-container" hidden>
                                    <button type="button" class="js-card-flip" tabindex="-1">Flip</button>
                                    <button type="button" class="js-card-edit-answer-button" data-index="${index}" tabindex="-1">Edit</button>
                                    <button type="button" class="js-card-delete-button" data-index="${index}" tabindex="-1">Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                        `);
                });
            }

            Slick.run(Slick.cards);
            Slick.goTo(Slick.cards, Slick.cardFocus, true);
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
        $('.js-toggle-create-deck-form').click(e => {
            Alert.createDeck();
        });
        //Show Create Card form
        $('.js-toggle-create-card-form').click(e => {
            Alert.createCard(deck.currentDeck._id);
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
            Deck.editCard(e, "Question");
        });
        //Edit card answer
        $('.js-cards-list').on("click", ".js-card-edit-answer-button", function (e) {
            Deck.editCard(e, "Answer");
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
        const $field = $(e.currentTarget).find('.js-new-deck');
        //Create deck then reload decks page
        Ajax.createDeck($field.val())
            .then(() => {
                $field.val("");
                App.showPage('decks');
            });
    },
    createCard: function (e) {
        const $this = $(e.currentTarget);
        const $question = $this.find('.js-new-card-question');
        const $answer = $this.find('.js-new-card-answer');
        //Add card to deck then reload cards page
        Ajax.createCard(deck.currentDeck._id, $question.val(), $answer.val())
            .then(() => {
                //Retrieve updated deck
                return Ajax.deckByID(deck.currentDeck._id);
            })
            .then((data) => {
                //Show updated cards
                deck.currentDeck = data;
                $question.val('');
                $answer.val('');
                App.showPage('cards');
            });
    },
    editDeck: function (e) {
        const selected = e.currentTarget.dataset.index;
        const deckID = deck.deckList[selected]._id;
        const $deckTitle = $(e.currentTarget).parent().siblings('h2');
        const currentTitle = $deckTitle.text();
        Alert.editDeck(currentTitle, deckID).then(newTitle => {
            if (!newTitle) return;
            //Update frontend data with new title so save a backend request
            $deckTitle.text(newTitle);
            deck.deckList[selected].title = newTitle;
        });
    },
    editCard: function (e, cardSide) {
        const index = e.currentTarget.dataset.index;
        const _deck = deck.currentDeck;
        const _card = _deck.cards[index];
        const $cardText = $(e.currentTarget).parent().siblings('h3');
        let currentText;
        if (cardSide === "Question") {
            currentText = _card.question;
        } else { currentText = _card.answer };
        Alert.editCard(_deck._id, _card._id, cardSide, currentText).then(newText => {
            if (!newText) return;
            //Update frontend data to save a backend request
            $cardText.text(newText);
            if (cardSide === 'Question') {
                _card.question = newText;
            } else { _card.answer = newText; }
        })
    },
    deleteDeck: function (e) {
        let index = e.currentTarget.dataset.index;
        const _deck = deck.deckList[index];
        const deckTitle = _deck.title;
        const deckID = _deck._id;
        Alert.deleteDeck(deckTitle, deckID)
            .then(res => {
                if (res.dismiss) return;
                if (index != 0) {
                    index--;
                }
                Slick.deckFocus = index;
                App.showPage('decks');
            });
    },
    deleteCard: function (e) {
        let index = e.currentTarget.dataset.index;
        const _deck = deck.currentDeck;
        const cardID = _deck.cards[index]._id;
        const deckID = _deck._id;
        Alert.deleteCard(deckID, cardID)
            .then(res => {
                if (res.dismiss) return res;
                if (index != 0) {
                    index--;
                }
                Slick.cardFocus = index;
                return Ajax.deckByID(deckID);
            })
            .then(res => {
                if (res.dismiss) return res;
                deck.currentDeck = res;
                App.showPage('cards');
            })
    },
    flipCard: function (e) {
        const $this = $(e.currentTarget);
        const $buttons = $this.parent().children();
        const $otherSideButtons = $this.parent().parent().siblings().children().children();
        //tabindex
        App.toggleTabindex($buttons);
        App.toggleTabindex($otherSideButtons);
        //Flip card
        $this.closest('.flipper').toggleClass("flip");
        //Focus on first button
        $otherSideButtons.first().addClass('focusButton').focus();
        $buttons.first().removeClass('focusButton');
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

const Slick = {
    decks: $('.js-decks-container'),
    cards: $('.js-cards-list'),
    active: null,
    deckFocus: 0,
    cardFocus: 0,
    init: function () {
        this.run(this.decks);
        this.run(this.cards);
        Slick.bindUIActions(this.decks);
        Slick.bindUIActions(this.cards);
    },
    bindUIActions: function ($elem) {
        //Shows and hides buttons based on current slide focus
        $elem.on('beforeChange', function (e, slick, current, next) {
            if (current !== next) {
                const $current = $(slick.$slides[current]).find('.card-buttons-container');
                const $next = $(slick.$slides[next]).find('.card-buttons-container');
                $current.hide();
                $next.show();
                //$(slick.$slides[next]).find('.focusButton');
            }
        });
    },
    run: function ($elem, initSlide = 0) {
        $elem.slick({
            speed: 300,
            infinite: false,
            variableWidth: true,
            centerMode: true,
            touchThreshold: 12,
            swipeToSlide: true,
            focusOnSelect: true,
            initialSlide: initSlide,
        });
        //Turns on tabindexing for the first slide
        const slick = $elem.slick('getSlick');
        const $firstSlide = $(slick.$slides[initSlide]).find('.card-buttons-container');
        if ($firstSlide) {
            $firstSlide.show();
        }
    },
    destroy: function ($elem) {
        $elem.slick('unslick');
    },
    goTo: function ($slick, slide, noAnimation = false) {
        $slick.slick('slickGoTo', slide, noAnimation);
    },
    next: function () {
        Slick.active.slick('slickNext');
    },
    prev: function () {
        Slick.active.slick('slickPrev');
    }
}

const Alert = {
    //custom settings
    swalC: null,
    init: function () {
        //Sets default settings
        swalC = swal.mixin({
            confirmButtonColor: '#05668D',
        })
    },
    createDeck: async function () {
        return swalC({
            input: 'text',
            title: 'Enter Deck Name',
            showCancelButton: true,
            showLoaderOnConfirm: true,
            preConfirm: (text) => {
                if (!text) {
                    return swal.showValidationMessage(
                        `Please enter a name.`
                    )
                }
                return Ajax.createDeck(text)
                    .catch(err => {
                        swal.showValidationMessage(
                            `Request Failed: ${err.responseJSON.message}`
                        );
                    })
            },
            allowOutsideClick: () => !swal.isLoading()
        }).then(res => {
            if (res.value) {
                App.showPage('decks');
            }
        })
    },
    createCard: async function (deckID) {
        return swalC.mixin({
            input: 'textarea',
            showCancelButton: true,
            confirmButtonText: 'Submit',
            progressSteps: ['1', '2'],
            preConfirm: (text) => {
                if (!text) {
                    return swal.showValidationMessage(
                        `Please enter in some text.`
                    )
                }
            }
        }).queue([
            'Enter Question',
            'Enter Answer'
        ]).then(res => {
            if (res.value) {
                swalC({
                    title: 'Please Wait..!',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    allowEnterKey: false,
                    onOpen: () => {
                        swal.showLoading()
                    }
                })
                const question = res.value[0];
                const answer = res.value[1];
                return Ajax.createCard(deckID, question, answer)
                    .catch(err => {
                        swal.showValidationMessage(
                            `Request Failed: ${err.responseJSON.message}`
                        );
                    })
            }
        }).then(res => {
            swal.close();
            //Retrieve updated deck
            return Ajax.deckByID(deckID);
        }).then(res => {
            deck.currentDeck = res;
            App.showPage('cards');
        })
    },
    editDeck: async function (current, deckID) {
        let newTitle;
        return swalC({
            input: 'text',
            inputValue: current,
            title: 'Edit Deck Name',
            showCancelButton: true,
            showLoaderOnConfirm: true,
            preConfirm: (text) => {
                //If no change simply return
                if (text === current) {
                    return current;
                }
                newTitle = text;
                return Ajax.updateDeck(deckID, newTitle)
                    .catch(err => {
                        swal.showValidationMessage(
                            `Request Failed: ${err.responseJSON.message}`
                        )
                    })
            },
            allowOutsideClick: () => !swal.isLoading()
        }).then(res => {
            return newTitle;
        })

    },
    deleteDeck: async function (deckTitle, deckID) {
        return swalC({
            title: `Delete "${deckTitle}"?`,
            text: "You won't be able to revert this!",
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            preConfirm: () => {
                return Ajax.deleteDeck(deckID)
                    .catch(err => {
                        swal.showValidationMessage(
                            `Request Failed: ${err.responseJSON.message}`
                        )
                    });
            },
            allowOutsideClick: () => !swal.isLoading()
        })
    },
    editCard: async function (deckID, cardID, cardSide, current) {
        let newText;
        return swalC({
            input: 'textarea',
            inputValue: current,
            title: `Edit Card ${cardSide}`,
            showCancelButton: true,
            showLoaderOnConfirm: true,
            preConfirm: (text) => {
                if (text === current) {
                    return current;
                }
                newText = text;
                return Ajax.updateCard(deckID, cardID, cardSide, newText)
                    .catch(err => {
                        swal.showValidationMessage(
                            `Request Failed: ${err.responseJSON.message}`
                        )
                    })
            },
            allowOutsideClick: () => !swal.isLoading()
        }).then(res => {
            return newText;
        })
    },
    deleteCard: async function (deckID, cardID) {
        return swalC({
            title: 'Delete Card?',
            text: "You won't be able to revert this!",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
            preConfirm: () => {
                return Ajax.deleteCard(deckID, cardID)
                    .catch(err => {
                        swal.showValidationMessage(
                            `Request Failed: ${err.responseJSON.message}`
                        )
                    });
            },
            allowOutsideClick: () => !swal.isLoading()
        })
    }
}

function onLoad() {
    App.init();
    Deck.init();
    Quiz.init();
    Slick.init();
    Alert.init();
}

$(onLoad);