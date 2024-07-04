let totalMeatQuantity = 0;
let meatQuantities = {};
let userAdjustedMeats = {};

// Function to populate meat options from config.js
function populateMeatPreferences() {
    var meatPreferencesSelect = document.getElementById('meatPreferences');
    var meatOptions = Object.keys(CONFIG.MEAT_NAMES_HE);

    meatOptions.forEach(function(option) {
        var optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = CONFIG.MEAT_NAMES_HE[option];
        meatPreferencesSelect.appendChild(optionElement);
    });
}

// Call the function to populate meat preferences on page load
populateMeatPreferences();

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

    // Remove previously added copy button if any
    var copyContainer = document.getElementById('copyContainer');
    copyContainer.innerHTML = '';

    // Add copy button only if there are results
    if (Object.keys(meatQuantities).length > 0) {
        var copyButton = document.createElement('button');
        copyButton.textContent = 'העתק כמויות';
        copyButton.onclick = copyToClipboard;
        copyContainer.appendChild(copyButton);
    }
}

function copyToClipboard() {
    var copyText = "";
    Object.keys(meatQuantities).forEach(meat => {
        if (typeof meatQuantities[meat] === 'object') {
            copyText += `${CONFIG.MEAT_NAMES_HE[meat]}: ${meatQuantities[meat].grams} גרם (${meatQuantities[meat].units} יחידות)\n`;
        } else {
            copyText += `${CONFIG.MEAT_NAMES_HE[meat]}: ${Math.ceil(meatQuantities[meat])} גרם\n`;
        }
    });

    // Copy text to clipboard
    navigator.clipboard.writeText(copyText).then(function() {
        showCopyMessage("הועתק ללוח");
    }, function(err) {
        console.error('Could not copy text: ', err);
        showCopyMessage("אירעה שגיאה בהעתקה");
    });
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

let adjustTimeout;

function adjustMeat(slider) {
    var meat = slider.getAttribute('data-meat');
    var newGrams = parseInt(slider.value);

    // Clear previous timeout to debounce
    clearTimeout(adjustTimeout);

    // Set timeout to update after a short delay
    adjustTimeout = setTimeout(function() {
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
    }, 200); // Adjust the debounce delay as needed
}

document.addEventListener('DOMContentLoaded', function() {
    // Replace "0 selected" with Hebrew text
    var meatPreferencesSelect = document.getElementById('meatPreferences');
    meatPreferencesSelect.setAttribute('data-placeholder', 'בחרו בשרים');

    // Initialize or update the select2 instance if used
    $(meatPreferencesSelect).select2();
});
