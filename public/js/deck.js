const Deck = {
    deckList: null,
    active: null,
    init: function () {
        this.bindUIActions();
    },
    bindUIActions: function () {
        //Create new deck
        $('.js-toggle-create-deck-form').click(e => {
            Alert.createDeck();
        });
        //Show Create Card form
        $('.js-toggle-create-card-form').click(e => {
            Alert.createCard(Deck.active._id);
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
    editDeck: function (e) {
        const selected = e.currentTarget.dataset.index;
        const deckID = Deck.deckList[selected]._id;
        const $deckTitle = $(e.currentTarget).parent().siblings('h2');
        const currentTitle = $deckTitle.text();
        Alert.editDeck(currentTitle, deckID).then(newTitle => {
            if (!newTitle) return;
            //Update frontend data with new title so save a backend request
            $deckTitle.text(newTitle);
            Deck.deckList[selected].title = newTitle;
        });
    },
    editCard: function (e, cardSide) {
        const index = e.currentTarget.dataset.index;
        const _deck = Deck.active;
        const _card = _deck.cards[index];
        const $cardText = $(e.currentTarget).parent().siblings('h3');
        let currentText;
        if (cardSide === "Question") {
            currentText = _card.question;
        } else { currentText = _card.answer };
        Alert.editCard(_deck._id, _card._id, cardSide, currentText).then(newText => {
            if (!newText) return;
            //Update frontend data to save a backend request
            const fontSize = App.render.strToFontSize(newText);
            $cardText.css('font-size', fontSize);
            $cardText.text(newText);
            if (cardSide === 'Question') {
                _card.question = newText;
            } else { _card.answer = newText; }
        })
    },
    deleteDeck: function (e) {
        let index = e.currentTarget.dataset.index;
        const _deck = Deck.deckList[index];
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
        const _deck = Deck.active;
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
                Deck.active = res;
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