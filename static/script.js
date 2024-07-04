let totalMeatQuantity = 0;
let meatQuantities = {};
let userAdjustedMeats = {};

function calculateMeat() {
    var adultsInput = document.getElementById('adults');
    var kidsInput = document.getElementById('kids');
    var hungerLevelInput = document.getElementById('hungerLevel');
    var meatPreferencesInput = document.getElementById('meatPreferences');
    var resultsDiv = document.getElementById('results');
    var totalMeatDiv = document.getElementById('totalMeat');

    if (!adultsInput.checkValidity() || !kidsInput.checkValidity() || !hungerLevelInput.checkValidity() || !meatPreferencesInput.checkValidity()) {
        resultsDiv.innerHTML = '<p class="error-message">אנא מלאו את כל השדות כראוי.</p>';
        return;
    }

    var adults = parseInt(adultsInput.value);
    var kids = parseInt(kidsInput.value);
    var hungerLevel = hungerLevelInput.value;
    var selectedMeats = Array.from(meatPreferencesInput.selectedOptions).map(option => option.value);

    var totalPeople = adults + (kids * CONFIG.KIDS_FACTOR);
    var totalMeatPerPerson = CONFIG.RECOMMENDED_MEAT_PER_ADULT[hungerLevel];
    totalMeatQuantity = totalPeople * totalMeatPerPerson;

    meatQuantities = {};
    userAdjustedMeats = {}; // Clear user adjustments

    selectedMeats.forEach(meat => {
        var meatGrams = totalMeatQuantity / selectedMeats.length;
        if (CONFIG.WEIGHT_PER_UNIT[meat]) {
            meatQuantities[meat] = {
                grams: Math.ceil(meatGrams / CONFIG.WEIGHT_PER_UNIT[meat]) * CONFIG.WEIGHT_PER_UNIT[meat],
                units: Math.ceil(meatGrams / CONFIG.WEIGHT_PER_UNIT[meat])
            };
        } else {
            meatQuantities[meat] = meatGrams;
        }
    });

    displayResults(meatQuantities);
}

function displayResults(meatQuantities) {
    var resultsDiv = document.getElementById('results');
    var totalMeatDiv = document.getElementById('totalMeat');
    resultsDiv.innerHTML = '<h3>כמויות בשרים מומלצות:</h3>';
    let totalGrams = 0;

    Object.keys(meatQuantities).forEach(meat => {
        if (typeof meatQuantities[meat] === 'object') {
            var gramsDisplay = meatQuantities[meat].grams;
            var unitsDisplay = meatQuantities[meat].units;
            totalGrams += gramsDisplay;
            resultsDiv.innerHTML += `${CONFIG.MEAT_NAMES_HE[meat]}: ${gramsDisplay} גרם (${unitsDisplay} יחידות) <input type="range" min="0" max="${totalMeatQuantity}" value="${gramsDisplay}" data-meat="${meat}" oninput="adjustMeat(this)">`;
        } else {
            var quantityDisplay = Math.ceil(meatQuantities[meat]);
            totalGrams += quantityDisplay;
            resultsDiv.innerHTML += `${CONFIG.MEAT_NAMES_HE[meat]}: ${quantityDisplay} גרם <input type="range" min="0" max="${totalMeatQuantity}" value="${quantityDisplay}" data-meat="${meat}" oninput="adjustMeat(this)">`;
        }
    });
    totalMeatDiv.innerHTML = `<h3>סה"כ בשר: ${totalGrams} גרם</h3>`;
}

function adjustMeat(slider) {
    var meat = slider.getAttribute('data-meat');
    var newGrams = parseInt(slider.value);

    // Calculate total adjusted meat excluding the current meat being adjusted
    var totalAdjustedMeatExcludingCurrent = 0;
    Object.keys(meatQuantities).forEach(key => {
        if (userAdjustedMeats[key] && key !== meat) {
            if (typeof meatQuantities[key] === 'object') {
                totalAdjustedMeatExcludingCurrent += meatQuantities[key].grams;
            } else {
                totalAdjustedMeatExcludingCurrent += meatQuantities[key];
            }
        }
    });

    // Calculate the remaining meat quantity that can be allocated
    var remainingMeatForCurrent = totalMeatQuantity - totalAdjustedMeatExcludingCurrent;

    // Ensure the new meat value does not exceed the remaining meat quantity and is not negative
    if (newGrams > remainingMeatForCurrent) {
        newGrams = remainingMeatForCurrent;
    } else if (newGrams < 0) {
        newGrams = 0;
    }

    // Update the meat quantity with the adjusted value
    if (typeof meatQuantities[meat] === 'object') {
        meatQuantities[meat].grams = newGrams;
        meatQuantities[meat].units = Math.ceil(newGrams / CONFIG.WEIGHT_PER_UNIT[meat]);
    } else {
        meatQuantities[meat] = newGrams;
    }

    userAdjustedMeats[meat] = true; // Track user adjustments

    var totalAdjustedMeat = 0;
    Object.keys(meatQuantities).forEach(key => {
        if (userAdjustedMeats[key]) {
            if (typeof meatQuantities[key] === 'object') {
                totalAdjustedMeat += meatQuantities[key].grams;
            } else {
                totalAdjustedMeat += meatQuantities[key];
            }
        }
    });

    var remainingMeat = totalMeatQuantity - totalAdjustedMeat;
    var remainingMeats = Object.keys(meatQuantities).filter(key => !userAdjustedMeats[key]).length;

    if (remainingMeats > 0) {
        var newPerMeatQuantity = remainingMeat / remainingMeats;
        Object.keys(meatQuantities).forEach(key => {
            if (!userAdjustedMeats[key]) {
                if (typeof meatQuantities[key] === 'object') {
                    meatQuantities[key].grams = Math.ceil(newPerMeatQuantity / CONFIG.WEIGHT_PER_UNIT[key]) * CONFIG.WEIGHT_PER_UNIT[key];
                    meatQuantities[key].units = Math.ceil(newPerMeatQuantity / CONFIG.WEIGHT_PER_UNIT[key]);
                } else {
                    meatQuantities[key] = Math.ceil(newPerMeatQuantity);
                }
            }
        });
    }

    displayResults(meatQuantities);
}
