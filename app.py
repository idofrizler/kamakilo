from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import os

load_dotenv()  # Load environment variables from .env file

app = Flask(__name__)

@app.route('/')
def index():
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

    return jsonify(meat_quantities)

if __name__ == '__main__':
    app.run(debug=True)
