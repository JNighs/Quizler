const Quiz = {
    index: 0,
    score: 0,
    dragging: false,
    originX: null,
    frontElem: null,
    backElem: null,
    deck: null,
    $flipper: null,
    animated: false,
    init: function () {
        this.bindUIActions();
    },
    bindUIActions: function () {
        //Return to cards page
        $('.js-reset-button').click(function () {
            Quiz.resetQuiz();
        });
        //Flip card
        $('.js-quiz-page').on("click", ".front, .back", function (e) {
            if (!Quiz.dragging) {
                Quiz.flipCard();
            }
        });
        //Dragging
        $('.js-quiz-page').on("pointerdown", ".front, .back", function (e) {
            Quiz.startDrag(e);
        });
        $('.js-quiz-page').on("pointermove", ".front, .back", function (e) {
            Quiz.duringDrag(e);
        });
        $('.js-quiz-page').on("pointerup", ".front, .back", function (e) {
            Quiz.endDrag(e);
            if (!Quiz.dragging) { Quiz.flipCard(); }
        });
    },
    startQuiz: function () {
        $('.js-reset-button').show();
        Quiz.deck = Quiz.shuffleDeck(Deck.active.cards);
        Quiz.renderCard();
    },
    //Randomize card array order
    shuffleDeck: function (original) {
        const array = original.slice();
        var currentIndex = array.length, temporaryValue, randomIndex;
        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    },
    renderCard: function () {
        const card = Quiz.deck[Quiz.index];
        const q = card.question;
        const a = card.answer;
        const $page = $('.js-quiz-page');
        const $card = App.render.card(q, a, Quiz.index, true);
        $page.html($card);
        //These are set so transform can be applied to both sides of the card
        $flipper = $('.js-quiz-page').find('.flipper');
        Quiz.frontElem = $flipper.children('.front')[0];
        Quiz.backElem = $flipper.children('.back')[0];
        //Animate the card appearing
        $flipper.find('.back h3').addClass('blank-card');
        $flipper.addClass("flip");
        $flipper.children().animate({
            height: '300px'
        }, 200, function () {
            $card.children().removeClass("flip");
            //Wait for flip animation to finish before showing back text
            $card.bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd",
                function () {
                    Quiz.animated = false;
                    $card.find('.back h3').removeClass('blank-card');
                });
        })
        Quiz.animated = true;
    },
    startDrag: function (e) {
        e.preventDefault();
        e.stopPropagation();
        Quiz.originX = e.clientX;
        e.target.setPointerCapture(e.pointerId);
    },
    duringDrag: function (e) {
        if (Quiz.originX) {
            const currentX = e.clientX;
            const delta = currentX - Quiz.originX;
            const rotate = delta * 0.2;
            const element = e.currentTarget;
            Quiz.dragging = true;

            if ($(element).hasClass('front')) {
                const translate = `translateX(${delta}px) rotate(${rotate}deg)`;
                element.style.transform = translate;
                Quiz.backElem.style.transform = translate;
            } else {
                element.style.transform = `translateX(${delta * -1}px) rotate(${rotate * -1}deg) rotateY(180deg)`;
                Quiz.frontElem.style.transform = `translateX(${delta * -1}px) rotate(${rotate * -1}deg) rotateY(0deg)`;
            }

            if (delta > 75) {
                Quiz.cardHighlight(true);
            } else if (delta < -75) {
                Quiz.cardHighlight(false);
            } else {
                Quiz.frontElem.style.boxShadow = "";
                Quiz.backElem.style.boxShadow = "";
            }
        }
    },
    endDrag: function (e) {
        if (!Quiz.originX) return;

        e.preventDefault();
        const currentX = e.clientX;
        const delta = currentX - Quiz.originX;

        Quiz.originX = null;

        if (delta > 75) {
            Quiz.cardSlide(true);
        } else if (delta < -75) {
            Quiz.cardSlide(false);
        } else {
            Quiz.frontElem.style.transform = '';
            Quiz.backElem.style.transform = '';
        }

        //Unfortunate hack to prevent click bind from firing after releasing drag
        setTimeout(function () { Quiz.dragging = false; }, 300);
    },
    //Animate the card pushing off to left or right depending on correct answer
    cardSlide: function (isCorrect, distance = 300) {
        const $card = $flipper.children();
        const waitFor = $card.length;
        let i = 0;

        //If the card is flipped around, reverse slide direction
        if ($flipper.hasClass('flip')) {
            distance = distance * -1;
        }

        if (isCorrect) {
            Quiz.cardHighlight(true);
            $card.animate({
                left: `${distance}px`,
                opacity: 0,
            }, 200, function () {
                //Wait for both elements to fire (front and back)
                i++;
                if (i === waitFor) {
                    Quiz.changeCardScore(true);
                    Quiz.changeCard();
                }
            });
        } else {
            Quiz.cardHighlight(false);
            $card.animate({
                left: `${distance * -1}px`,
                opacity: 0,
            }, 200, function () {
                //Wait for both elements to fire (front and back)
                i++;
                if (i === waitFor) {
                    Quiz.changeCardScore(false);
                    Quiz.changeCard();
                }
            });
        }

    },
    //Colors a border around the card depending on drag direction
    cardHighlight: function (isCorrect) {
        const correct = '0 0 0 8pt #02C39A';
        const incorrect = '0 0 0 8pt #EF476F';
        if (isCorrect) {
            Quiz.frontElem.style.boxShadow = correct;
            Quiz.backElem.style.boxShadow = correct;
        } else {
            Quiz.frontElem.style.boxShadow = incorrect;
            Quiz.backElem.style.boxShadow = incorrect;
        }
    },
    flipCard: function (e) {
        //Make sure not to fire flip animation if already animating or dragging
        if (!Quiz.animated && !Quiz.dragging) {
            $flipper.toggleClass("flip");
            Quiz.animated = true;
        }
        //Flag off when animation done
        $flipper.bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd",
            function () {
                Quiz.animated = false;
            })
    },
    //Render new card, or score page if no cards left
    changeCard: function () {
        Quiz.index++;
        if (Quiz.index != Deck.active.cards.length)
            Quiz.renderCard(Quiz.index);
        else {
            Quiz.showScore();
        }
    },
    //Send backend call to save card's value (amount user has gotten it correct or not)
    changeCardScore: function (increase) {
        const deckID = Deck.active._id;
        const cardID = Deck.active.cards[Quiz.index]._id;
        if (increase) {
            Quiz.score++;
            Ajax.updateCardValue(deckID, cardID, true);
        } else {
            Ajax.updateCardValue(deckID, cardID, false);
        }
    },
    //Show score page
    showScore: function () {
        const numOfCards = Quiz.deck.length;
        const percent = Math.floor(Quiz.score * 100 / numOfCards);
        App.showPage('score');
        $('.js-score-container').html(`
            <h2 class="score">Your Score: <span class="text-highlight">${Quiz.score}/${numOfCards}</span></h2>
            <h2 class="score">You got <span class="text-highlight">${percent}%</span> correct.</h2>
        `);
    },
    //Reset variables and return to cards page
    resetQuiz: function () {
        Quiz.index = 0;
        Quiz.score = 0;
        Quiz.deck = null;
        //Quick fix - undo reverse that page method begins with
        Deck.active.cards.reverse();
        App.showPage('cards');
    }
}