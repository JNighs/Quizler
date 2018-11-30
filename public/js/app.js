const App = {
    userLoggedIn: false,
    init: function () {
        user = this.userSettings;
        this.bindUIActions();
        this.loginCheck();
        //TODO - Clean up login logic
        if (this.userLoggedIn) { this.showPage('decks'); }
    },
    bindUIActions: function () {
        //Route account form, either login or create
        $('.js-account-form').submit(e => {
            e.preventDefault();
            App.routeAccountForm(e);
        });
        //Logout
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
        //Start quiz
        $('.js-start-quiz-button').click(function () {
            App.showPage('quiz');
        });
        //Binds keyboard
        $(document).keydown(function (e) {
            //If quiz is active
            if (Quiz.deck !== null) {
                switch (e.which) {
                    case 37: // left
                        Quiz.cardSlide(false, 500);
                        break;
                    case 39: // right
                        Quiz.cardSlide(true, 500);
                        break;
                    case 32: // space
                        Quiz.flipCard();
                        break;
                    default: return; // exit this handler for other keys
                }
                e.preventDefault();
            }
            //If carousel active
            else if (!$(e.target).is('input') && Slick.active) {
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
            App.userLoggedIn = true;
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
        Slick.destroy(Slick.cards);
        Slick.decks.empty();
        App.showPage('login');
    },
    //Go to selected Deck's cards page
    selectDeck: function (e) {
        const selected = e.currentTarget.dataset.index;
        Slick.deckFocus = selected;
        Deck.active = Deck.deckList[selected];
        App.showPage('cards');
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
                    $('.js-reset-button').hide();
                    App.removeAccountError();
                    break;
                case 'decks':
                    $('.js-logout-button').show();
                    Ajax.deckList().then(App.render.decks);
                    Slick.active = Slick.decks;
                    Slick.cardFocus = 0;
                    break;
                case 'cards':
                    if (Deck.active.cards.length === 0) {
                        $('.js-start-quiz-button').hide();
                    } else { $('.js-start-quiz-button').show(); }
                    $('.js-reset-button').hide();
                    App.render.cardList();
                    Slick.active = Slick.cards;
                    break;
                case 'quiz':
                    Quiz.startQuiz();
                    break;
            }
        },
        decks: function (data) {
            const $deckContainer = $('.js-decks-container');
            //Reset container
            Slick.destroy(Slick.decks);
            $deckContainer.empty();
            //Reverse so that the newest deck is at front
            Deck.deckList = data.reverse();
            //Populate decks list
            Deck.deckList.forEach((deck, index) => {
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
        //TODO - Remove global active and replace with passed variable
        cardList: function () {
            const cardList = Deck.active.cards.reverse();
            const $list = $('.js-cards-list');
            //Reset container
            Slick.destroy(Slick.cards);
            $list.empty();
            if (!cardList.empty) {
                cardList.forEach((card, index) => {
                    const html = App.render.card(card.question, card.answer, index);
                    $list.append(html);
                });
            }

            Slick.run(Slick.cards);
            Slick.goTo(Slick.cards, Slick.cardFocus, true);
        },
        card: function (question, answer, index, forQuiz) {
            const $container = $('<div class="js-card-container"></div>');
            const $question = $(`<h3>${question}</h3>`);
            const $answer = $(`<h3>${answer}</h3>`);
            //Calculate font size based on string length and modify css
            const qSize = App.render.strToFontSize(question);
            const aSize = App.render.strToFontSize(answer);
            $question.css('font-size', qSize);
            $answer.css('font-size', aSize);
            //Render card whether it's for the card page or quiz
            let card;
            if (!forQuiz) { card = App.render.cardForSlick($question, $answer, index); }
            else { card = App.render.cardForQuiz($question, $answer); }

            $container.append(card);
            return $container;
        },
        cardForSlick: function ($question, $answer, index) {
            return `
            <div class="flipper">
                <div class="front">
                    ${$question.prop('outerHTML')}
                    <div class="card-buttons-container" hidden>    
                        <button type="button" class="js-card-flip focusButton">Flip</button>
                        <button type="button" class="js-card-edit-question-button" data-index="${index}">Edit</button>
                        <button type="button" class="js-card-delete-button" data-index="${index}">Delete</button>
                    </div>
                </div>
                <div class="back">
                    ${$answer.prop('outerHTML')}
                    <div class="card-buttons-container" hidden>
                        <button type="button" class="js-card-flip" tabindex="-1">Flip</button>
                        <button type="button" class="js-card-edit-answer-button" data-index="${index}" tabindex="-1">Edit</button>
                        <button type="button" class="js-card-delete-button" data-index="${index}" tabindex="-1">Delete</button>
                    </div>
                </div>
            </div>
            `;
        },
        cardForQuiz: function ($question, $answer) {
            return `
            <div class="flipper">
                <div class="front quiz-card">
                    ${$question.prop('outerHTML')}
                </div>
                <div class="back quiz-card">
                    ${$answer.prop('outerHTML')}
                </div>
            </div>
            `
        },
        strToFontSize: function (str) {
            const strLength = str.split(" ").length;
            if ((strLength >= 1) && (strLength < 10)) {
                return '24px';
            }
            else if ((strLength >= 10) && (strLength < 20)) {
                return '18px';
            }
            else if ((strLength >= 20) && (strLength < 30)) {
                return '16px';
            }
            else if ((strLength >= 30) && (strLength < 40)) {
                return '14px';
            }
            else {
                return '12px';
            }
        },
    },
};