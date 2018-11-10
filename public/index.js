let s, deck, user;
const App = {
    settings: {

    },
    deckSettings: {
        deckList: null,
        currentDeck: null,
        card: 0,
        score: 0,
    },
    userSettings: {
        token: null,
        obj: null
    },

    init: function () {
        s = this.settings;
        deck = this.deckSettings;
        user = this.userSettings;
        this.bindUIActions();
    },

    bindUIActions: function () {
        $('.js-account-form').submit(e => {
            e.preventDefault();
            App.createAccount(e);
        });
    },

    createAccount: function (e) {
        $this = $(e.currentTarget);
        const username = $this.find('.js-account-username').val();
        const password = $this.find('.js-account-password').val();
        postCreateAccount(username, password);
    }
};
/*
let currentCard = 0;
let currentDeck;
let deckList;
let score = 0;
let token;
let user;
*/
/*          AJAX Calls            */
function setHeader() {
    $.ajaxSetup({
        beforeSend: function (xhr) {
            if (localStorage.token) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.token);
            }
        }
    });
}

function postCreateAccount(username, password) {
    const data = JSON.stringify({ username: username, password: password });
    $.ajax({
        url: './api/users/',
        type: 'POST',
        data: data,
        contentType: 'application/json',
        success: function () {
            postLogin(username, password)
        }
    });
}

function postLogin(username, password) {
    const data = JSON.stringify({ username: username, password: password });
    $.ajax({
        url: './api/auth/login',
        type: 'POST',
        data: data,
        contentType: 'application/json',
        success: function (data) {
            localStorage.token = data.authToken;
            showPage('decks');
        }
    });
}

function getUser() {
    $.ajax({
        url: './userdata',
        type: 'GET',
        success: function (data) {
            user = data.user;
        }
    })
}

function getDeckList() {
    $.getJSON('./decks', renderDeckList);
}

function getDeckByID(id = currentDeck._id) {
    $.getJSON(`./decks/${id}`, function (data) {
        currentDeck = data;
        showPage('cards');
    });
}

function postNewDeck(deckTitle) {
    const data = JSON.stringify({ uid: user.id, title: deckTitle });
    $.ajax({
        url: './decks',
        type: 'POST',
        data: data,
        contentType: 'application/json',
        success: getDeckList
    });
}

function putCard(question, answer) {
    const cardData = JSON.stringify({
        id: currentDeck._id,
        question: question,
        answer: answer
    });
    $.ajax({
        url: './decks',
        type: 'PUT',
        data: cardData,
        contentType: 'application/json',
        success: getDeckByID
    });
}

/*          Page Methods            */

function showPage(inputPage) {
    const pages = ['login', 'decks', 'cards', 'quiz', 'score'];
    //Compare input page to available pages, show input page, hide the rest
    pages.forEach(page => {
        if (inputPage === page) {
            $(`.js-${page}-page`).show();
        } else $(`.js-${page}-page`).hide();
    })
    renderPage(inputPage);
}

function renderPage(inputPage) {
    switch (inputPage) {
        case 'decks':
            getDeckList();
            break;
        case 'cards':
            renderCardsPage();
            break;
    }
}

function renderDeckList(data) {
    deckList = data.decks;
    const $decks = $('.js-decks-container');
    $decks.empty();
    deckList.forEach((deck, index) => {
        $decks.append(`
            <button type="button" class="js-deck-button" data-index="${index}">${deck.title}</button>
        `);
    });
    $('.js-decks-page').show();
    watchDeckSelection();
}

function renderCardsPage(data = currentDeck) {
    const cardList = data.cards;
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


/*          Deck Methods            */

function renderCard(currentCard = 0) {
    const card = currentDeck.cards[currentCard];
    $('.js-card-text').html(`
        <div class="card-question">${card.question}</div>
        <div class="card-answer" hidden>${card.answer}</div>
    `);
}

function flipCard() {
    $('.card-question').toggle();
    $('.card-answer').toggle();
}

function changeCard() {
    currentCard++;
    if (currentCard != currentDeck.cards.length)
        renderCard(currentCard);
    else {
        showScore();
        watchReset();
    }

}

function showScore() {
    showPage('score');
    $('.js-score-container').html(`
        <div class="score">Your Score: ${score}/${currentDeck.cards.length}</div>
        <button type="button" class="js-reset-button">RESET</button>
    `);
}

/*          Event Callbacks            */

function watchCreateAccount() {
    $('.js-account-form').submit(e => {
        e.preventDefault();
        $this = $(e.currentTarget);
        const username = $this.find('.js-account-username').val();
        const password = $this.find('.js-account-password').val();
        postCreateAccount(username, password);
    });
}

function watchLogin() {
    $('.js-login-form').submit(e => {
        e.preventDefault();
        $this = $(e.currentTarget);
        const username = $this.find('.js-login-username').val();
        const password = $this.find('.js-login-password').val();
        postLogin(username, password);
    });
}

function watchlogOut() {
    $('.js-logout-button').click(e => {
        showPage('login');
        localStorage.clear();
    });
}

function watchDeckSelection() {
    $('.js-decks-container button').click(function (e) {
        const deck = e.currentTarget.dataset.index;
        currentDeck = deckList[deck];
        showPage('cards');
    });
}

function watchFlip() {
    $('.js-flip-button').click(function () {
        flipCard();
    });
}

function watchAnswer() {
    $('.js-correct-button').click(function () {
        score++;
        changeCard();
    });

    $('.js-incorrect-button').click(function () {
        changeCard();
    });
}

function watchReset() {
    $('.js-reset-button').click(function () {
        currentCard = 0;
        score = 0;
        showPage('cards');
    });
}

function watchNewDeck() {
    $('.js-deck-form').submit(e => {
        e.preventDefault();
        const deckTitle = $(e.currentTarget).find('.js-new-deck').val();
        postNewDeck(deckTitle);
    });
}

function watchNewCard() {
    $('.js-card-form').submit(e => {
        const $this = $(e.currentTarget);
        const cardQuestion = $this.find('.js-new-card-question').val();
        const cardAnswer = $this.find('.js-new-card-answer').val();
        e.preventDefault();
        putCard(cardQuestion, cardAnswer);
    });
}

function watchStartQuiz() {
    $('.js-start-quiz-button').click(function () {
        showPage('quiz');
        renderCard();
    });
}

function watchDecksPage() {
    $('.js-decks-button').click(e => {
        showPage('decks');
    });
}

/*          On Load            */

function onLoad() {
    setHeader();
    if (localStorage.token) {
        getUser();
        showPage('decks');
    }
    watchCreateAccount();
    watchLogin();
    watchDeckSelection();
    watchFlip();
    watchAnswer();
    watchNewDeck();
    watchNewCard();
    watchDecksPage();
    watchStartQuiz();
    watchlogOut();
}

$(onLoad);