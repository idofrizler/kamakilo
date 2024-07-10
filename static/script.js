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
    var eventTypeInput = document.getElementById('eventType');
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
    var eventType = eventTypeInput.value;
    var selectedMeats = Array.from(meatPreferencesInput.selectedOptions).map(option => option.value);

    var totalPeople = adults + (kids * CONFIG.KIDS_FACTOR);
    var totalMeatPerPerson = CONFIG.RECOMMENDED_MEAT_PER_ADULT[hungerLevel];
    totalMeatQuantity = totalPeople * totalMeatPerPerson;

    meatQuantities = {};
    userAdjustedMeats = {}; // Clear user adjustments

    let premiumMeats = selectedMeats.filter(meat => CONFIG.MEAT_COST.PREMIUM.includes(meat));
    let cheapMeats = selectedMeats.filter(meat => CONFIG.MEAT_COST.CHEAP.includes(meat));
    let otherMeats = selectedMeats.filter(meat => !premiumMeats.includes(meat) && !cheapMeats.includes(meat));

    let premiumMeatWeight = 0;
    let cheapMeatWeight = 0;

    switch (eventType) {
        case 'premium':
            premiumMeatWeight = totalMeatQuantity * 0.75;
            cheapMeatWeight = totalMeatQuantity - premiumMeatWeight;
            let nonPremiumMeats = cheapMeats.concat(otherMeats);
            if (premiumMeats.length === 0) {
                distributeMeat(nonPremiumMeats, totalMeatQuantity);                
                break;
            }
            if (nonPremiumMeats.length === 0) {
                distributeMeat(premiumMeats, totalMeatQuantity);
                break;
            }
            distributeMeat(premiumMeats, premiumMeatWeight);
            distributeMeat(nonPremiumMeats, cheapMeatWeight);                
            break;
        case 'costEffective':
            cheapMeatWeight = totalMeatQuantity * 0.75;
            premiumMeatWeight = totalMeatQuantity - cheapMeatWeight;
            let nonCheapMeats = premiumMeats.concat(otherMeats);
            if (cheapMeats.length === 0) {
                distributeMeat(nonCheapMeats, totalMeatQuantity);
                break;
            }
            if (nonCheapMeats.length === 0) {
                distributeMeat(cheapMeats, totalMeatQuantity);
                break;
            }
            distributeMeat(cheapMeats, cheapMeatWeight);
            distributeMeat(nonCheapMeats, premiumMeatWeight);
            break;
        case 'standard':
        default:
            distributeMeat(selectedMeats, totalMeatQuantity);
            break;
    }

    displayResults(meatQuantities);

    let eventDetails = {
        adults: adults,
        kids: kids,
        hungerLevel: hungerLevel,
        eventType: eventType,
        selectedMeats: selectedMeats
    };
    
    trackMeatQuantities(meatQuantities, eventDetails);

    // Remove previously added copy button if any
    var copyContainer = document.getElementById('copyContainer');
    copyContainer.innerHTML = '';

    // Add copy button only if there are results
    if (Object.keys(meatQuantities).length > 0) {
        var buttonContainer = document.createElement('div');
        buttonContainer.id = 'buttonContainer';
        buttonContainer.classList.add('button-container');

        var shareContainer = document.createElement('div');
        shareContainer.classList.add('share-container');
        // shareContainer.appendChild(document.createTextNode('שיתוף')); // Add trailing text

        var copyButton = document.createElement('button');
        copyButton.id = 'copyButton';
        copyButton.innerHTML = '<i class="far fa-copy"></i>';
        copyButton.title = 'העתק כמויות';
        copyButton.classList.add('icon-button'); // Add a class for styling
        copyButton.onclick = copyToClipboard;
        shareContainer.appendChild(copyButton);

        var whatsappButton = document.createElement('button');
        whatsappButton.id = 'whatsappButton';
        whatsappButton.innerHTML = '<i class="fab fa-whatsapp"></i>';
        whatsappButton.title = 'שתף ב-WhatsApp';
        whatsappButton.classList.add('icon-button'); // Add a class for styling
        whatsappButton.onclick = shareOnWhatsApp;
        shareContainer.appendChild(whatsappButton);

        buttonContainer.appendChild(shareContainer);

        var bugContainer = document.createElement('div');
        bugContainer.classList.add('bug-container');
        // bugContainer.appendChild(document.createTextNode('דווחו על בעיה:')); // Add trailing text

        var bugButton = document.createElement('button');
        bugButton.id = 'bugButton';
        bugButton.innerHTML = '<i class="fas fa-bug"></i>';
        bugButton.title = 'דווח על בעיה';
        bugButton.classList.add('icon-button');
        bugButton.onclick = function() {
            window.open(''); // Add the URL to your bug report form
        };
        bugContainer.appendChild(bugButton);

        buttonContainer.appendChild(bugContainer);

        copyContainer.appendChild(buttonContainer);
    }
}

function trackMeatQuantities(meatQuantities, eventDetails) {
    appInsights.trackEvent('MeatQuantitiesRecommended', {
        'eventDetails': JSON.stringify(eventDetails), 
        'meatQuantities': JSON.stringify(meatQuantities)
    });
}

function distributeMeat(meats, weight) {
    meats.forEach(meat => {
        var meatGrams = weight / meats.length;
        if (CONFIG.WEIGHT_PER_UNIT[meat]) {
            meatQuantities[meat] = {
                grams: Math.ceil(meatGrams / CONFIG.WEIGHT_PER_UNIT[meat]) * CONFIG.WEIGHT_PER_UNIT[meat],
                units: Math.ceil(meatGrams / CONFIG.WEIGHT_PER_UNIT[meat])
            };
        } else {
            meatQuantities[meat] = meatGrams;
        }
    });
}

function generateCopyText() {
    var copyText = "";
    Object.keys(meatQuantities).forEach(meat => {
        if (typeof meatQuantities[meat] === 'object') {
            copyText += `${CONFIG.MEAT_NAMES_HE[meat]}: ${meatQuantities[meat].grams} גרם (${meatQuantities[meat].units} יחידות)\n`;
        } else {
            copyText += `${CONFIG.MEAT_NAMES_HE[meat]}: ${Math.ceil(meatQuantities[meat])} גרם\n`;
        }
    });
    return copyText;
}

function copyToClipboard() {
    var copyText = generateCopyText();

    // Copy text to clipboard
    navigator.clipboard.writeText(copyText).then(function() {
        showCopyMessage("הועתק ללוח");
    }, function(err) {
        console.error('Could not copy text: ', err);
        showCopyMessage("אירעה שגיאה בהעתקה");
    });
}

function shareOnWhatsApp() {
    var text = generateCopyText();
    var url = "https://api.whatsapp.com/send/?text=" + encodeURIComponent(text);
    window.open(url, '_blank');
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

