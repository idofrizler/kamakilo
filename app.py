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

if __name__ == '__main__':
    app.run(debug=True)
