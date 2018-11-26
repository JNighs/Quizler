const Quiz = {
    card: 0,
    score: 0,
    init: function () {
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
            Quiz.score++;
            Quiz.changeCard();
        });

        $('.js-incorrect-button').click(function () {
            Quiz.changeCardScore(false);
            Quiz.changeCard();
        });
    },

    renderCard: function () {
        Deck.currentCard = Deck.currentDeck.cards[Quiz.card];
        $('.js-card-text').html(`
            <div class="card-question">${Deck.currentCard.question}</div>
            <div class="card-answer" hidden>${Deck.currentCard.answer}</div>
        `);
    },

    flipCard: function () {
        $('.card-question').toggle();
        $('.card-answer').toggle();
    },

    changeCard: function () {
        Quiz.card++;
        if (Quiz.card != Deck.currentDeck.cards.length)
            Quiz.renderCard(Quiz.card);
        else {
            Quiz.showScore();
        }

    },

    changeCardScore: function (increase) {
        const deckID = Deck.currentDeck._id;
        const cardID = Deck.currentDeck.cards[Quiz.card]._id;
        if (increase) {
            Ajax.updateCardValue(deckID, cardID, true);
        } else {
            Ajax.updateCardValue(deckID, cardID, false);
        }
    },

    showScore: function () {
        App.showPage('score');
        $('.js-score-container').html(`
            <div class="score">Your Score: ${Quiz.score}/${Deck.currentDeck.cards.length}</div>
        `);
    },

    resetQuiz: function () {
        Quiz.card = 0;
        Quiz.score = 0;
        App.showPage('cards');
    }
}