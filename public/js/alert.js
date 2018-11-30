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
                            `Request Failed: ${err.responseText}`
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
            if (res.dismiss) throw res;
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
                        `Request Failed: ${err.responseText}`
                    );
                })
        }).then(res => {
            swal.close();
            //Retrieve updated deck
            return Ajax.deckByID(deckID);
        }).then(res => {
            Deck.active = res;
            App.showPage('cards');
        }).catch(err => {
            swal.close();
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
                            `Request Failed: ${err.responseText}`
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
    },
    quizDirections: function () {
        swalC('Tap to flip card. <br>Swipe right if correct, <br>left if incorrect.');
    }
}