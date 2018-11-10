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
        $.ajax({
            url: './api/users/',
            type: 'POST',
            data: data,
            contentType: 'application/json',
            success: function () {
                this.login(username, password)
            }
        });
    },
    login(username, password) {
        const data = JSON.stringify({ username: username, password: password });
        return $.ajax({
            url: './api/auth/login',
            type: 'POST',
            data: data,
            contentType: 'application/json'
        });
    },
    userData() {
        $.ajax({
            url: './userdata',
            type: 'GET',
            success: function (data) {
                App.user = data.user;
            }
        })
    },
    deckList() {
        $.getJSON('./decks', App.render.decks);
    },
    deckByID(id) {
        $.getJSON(`./decks/${id}`, function (data) {
            Deck.currentDeck = data;
            App.showPage('cards');
        });
    },
    createDeck(title) {
        const data = JSON.stringify({ uid: App.user.id, title: title });
        $.ajax({
            url: './decks',
            type: 'POST',
            data: data,
            contentType: 'application/json',
            //Reload and render deck list
            success: this.deckList
        });
    },
    createCard(question, answer) {
        const cardData = JSON.stringify({
            id: deck.currentDeck._id,
            question: question,
            answer: answer
        });
        $.ajax({
            url: './decks',
            type: 'PUT',
            data: cardData,
            contentType: 'application/json',
            success: function () { Ajax.deckByID(deck.currentDeck._id); }
        });
    }
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
        if (user.isLoggedIn) { this.showPage('decks');; }
    },

    bindUIActions: function () {
        $('.js-account-form').submit(e => {
            e.preventDefault();
            App.createAccount(e);
        });

        $('.js-login-form').submit(e => {
            e.preventDefault();
            App.login(e);
        });

        $('.js-logout-button').click(e => {
            App.logout();
        });

        $('.js-decks-button').click(e => {
            App.showPage('decks');
        });

        //Select deck and view its cards
        $('.js-decks-container').on("click", "button", function (e) {
            App.selectDeck(e);
        });

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
    },

    loginCheck: function () {
        if (localStorage.token) {
            user.isLoggedIn = true;
            Ajax.setHeader();
            Ajax.userData();
        }
    },

    createAccount: function (e) {
        $this = $(e.currentTarget);
        const username = $this.find('.js-account-username').val();
        const password = $this.find('.js-account-password').val();
        Ajax.createAccount(username, password);
    },

    login: function (e) {
        $this = $(e.currentTarget);
        const username = $this.find('.js-login-username').val();
        const password = $this.find('.js-login-password').val();
        Ajax.login(username, password).then(data => {
            localStorage.token = data.authToken;
            App.loginCheck();
            App.showPage('decks');
        });
    },

    logout: function () {
        localStorage.clear();
        App.showPage('login');
    },

    selectDeck: function (e) {
        const selected = e.currentTarget.dataset.index;
        deck.currentDeck = deck.deckList[selected];
        App.showPage('cards');
    },

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
                case 'decks':
                    Ajax.deckList();
                    break;
                case 'cards':
                    App.render.cards();
                    break;
            }
        },
        decks: function (data) {
            const $decks = $('.js-decks-container');
            deck.deckList = data.decks;
            //Populate decks list
            $decks.empty();
            deck.deckList.forEach((deck, index) => {
                $decks.append(`
                    <button type="button" class="js-deck-button" data-index="${index}">${deck.title}</button>
                `);
            });
            //Show page
            $('.js-decks-page').show();
        },
        cards: function () {
            const cardList = deck.currentDeck.cards;
            const $list = $('.js-cards-list');
            $list.empty();
            if (!cardList.empty) {
                cardList.forEach(card => {
                    $list.append(`
                <div class="row">
                    <div class="column">${card.question}</div>
                    <div class="column">${card.answer}</div>
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
        currentDeck: null
    },
    init: function () {
        deck = this.settings;
    },
    createDeck: function (e) {
        const deckTitle = $(e.currentTarget).find('.js-new-deck').val();
        Ajax.createDeck(deckTitle);
    },
    createCard: function (e) {
        const $this = $(e.currentTarget);
        const cardQuestion = $this.find('.js-new-card-question').val();
        const cardAnswer = $this.find('.js-new-card-answer').val();
        Ajax.createCard(cardQuestion, cardAnswer);
    }
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
        $('.js-reset-button').click(function () {
            Quiz.resetQuiz();
        });

        $('.js-flip-button').click(function () {
            Quiz.flipCard();
        });

        $('.js-correct-button').click(function () {
            quiz.score++;
            Quiz.changeCard();
        });

        $('.js-incorrect-button').click(function () {
            Quiz.changeCard();
        });

        $('.js-start-quiz-button').click(function () {
            App.showPage('quiz');
            Quiz.renderCard();
        });
    },

    renderCard: function () {
        const card = deck.currentDeck.cards[quiz.card];
        $('.js-card-text').html(`
            <div class="card-question">${card.question}</div>
            <div class="card-answer" hidden>${card.answer}</div>
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

/*          On Load            */

function onLoad() {
    App.init();
    Deck.init();
    Quiz.init();
}

$(onLoad);