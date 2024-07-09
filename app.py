from flask import Flask, render_template, request, jsonify
from applicationinsights import TelemetryClient
import os
import logging
from logging import StreamHandler

app = Flask(__name__)
instrumentation_key = os.getenv('APPINSIGHTS_INSTRUMENTATIONKEY')
appinsights = TelemetryClient(instrumentation_key=instrumentation_key)

streamHandler = StreamHandler()
app.logger.setLevel(logging.DEBUG)
app.logger.addHandler(streamHandler)

@app.route('/')
def index():
    appinsights.track_event('Landing page loaded')
    
    referer = request.headers.get('Referer') if request.headers.get('Referer') else 'None'
    appinsights.track_event('Referer', { 'Referer': referer })
    
    appinsights.flush()

    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.json
    adults = data['adults']
    kids = data['kids']
    hunger_level = data['hungerLevel']
    meat_preferences = data['meatPreferences']

    total_people = adults + kids
    meat_factor = 1
    if hunger_level == 'moderate':
        meat_factor = 1.5
    elif hunger_level == 'veryHungry':
        meat_factor = 2

    meat_quantities = {meat: total_people * meat_factor for meat in meat_preferences}

    appinsights.track_event('Meat quantities calculated', { 'meatQuantities': meat_quantities })
    appinsights.flush()

    return jsonify(meat_quantities)

if __name__ == '__main__':
    app.run(debug=True)
