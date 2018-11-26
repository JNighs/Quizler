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