let currentCard = 0;
let currentDeck;
let score = 0;

class Deck {
    constructor(name) {
        this.name = name;
        this.cards = [];
    }

    addCard(question, answer) {
        this.cards.push(new Card(question, answer));
    }

    get length() {
        return Object.keys(this.cards).length;
    }
}

class Card {
    constructor(question, answer) {
        this.question = question;
        this.answer = answer;
    }
}

function renderDeckList() {
    const $decks = $('.js-decks-container');
    $decks.empty();
    decksDB.forEach((deck, index) => {
        $decks.append(`
            <button type="button" class="js-deck-button" data-index="${index}">${deck.name}</button>
        `);
    });
}

function renderCardsPage() {
    const $list = $('.js-cards-list');
    $list.empty();
    currentDeck.cards.forEach(card => {
        $list.append(`
        <div class="row">
            <div class="column">${card.question}</div>
            <div class="column">${card.answer}</div>
        </div>
    `);
    });
}

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
    if (currentCard != currentDeck.length)
        renderCard(currentCard);
    else {
        showScore();
        watchReset();
    }

}

function showScore() {
    $('.js-card-container').toggle();
    $('.js-score-container').html(`
        <div class="score">Your Score: ${score}/${currentDeck.length}</div>
        <button type="button" class="js-reset-button">RESET</button>
    `).toggle();
}

function watchDeckSelection() {
    $('.js-decks-container button').click(function (e) {
        const deck = e.currentTarget.dataset.index;
        currentDeck = decksDB[deck];
        $('.js-decks-page').toggle();
        $('.js-cards-page').toggle();
        renderCardsPage();
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
        $('.js-score-container').toggle();
        $('.js-card-container').toggle();
        $('.js-quiz-page').toggle();
        $('.js-cards-page').toggle();
        renderCard();
    });
}

function watchNewDeck() {
    $('.js-deck-form').submit(e => {
        e.preventDefault();
        const deckName = $(e.currentTarget).find('.js-new-deck').val();
        const newDeck = new Deck(deckName);
        newDeck.addCard("New Card Question", "New Card Answer");
        decksDB.push(newDeck);
        renderDeckList();
        watchDeckSelection();

    });
}

function watchNewCard() {
    $('.js-card-form').submit(e => {
        const $this = $(e.currentTarget);
        const cardQuestion = $this.find('.js-new-card-question').val();
        const cardAnswer = $this.find('.js-new-card-answer').val();
        e.preventDefault();
        currentDeck.addCard(cardQuestion, cardAnswer);
        renderCardsPage();
    });
}

function watchStartQuiz() {
    $('.js-start-quiz-button').click(function () {
        $('.js-cards-page').toggle();
        $('.js-quiz-page').toggle();
        renderCard();
    });
}

function testDeck() {
    cardsDB.forEach((deck) => {
        const questions = Object.keys(deck.questions);
        const answers = Object.values(deck.questions);
        newDeck = new Deck(deck.title);
        for (var i = 0; i < questions.length; i++) {
            newDeck.addCard(questions[i], answers[i]);
        }
        decksDB.push(newDeck);
    });

    console.log(decksDB);
}

function onLoad() {
    testDeck();

    renderDeckList();
    watchDeckSelection();
    watchFlip();
    watchAnswer();
    watchNewDeck();
    watchNewCard();
    watchStartQuiz();
}

$(onLoad);