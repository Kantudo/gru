import json

from flask import Flask
from flask import request

app = Flask(__name__)

from inference import infer

@app.route('/img', methods = ['POST'])
def img():
    if request.method == 'POST':
        # print(request.)

        return {'guess': infer(json.loads(request.data)['img'])}
        # return {'guess': -1}

@app.after_request # blueprint can also be app~~
def after_request(response):
    header = response.headers
    header['Access-Control-Allow-Origin'] = 'http://localhost:5000'
    header['Access-Control-Allow-Headers'] = 'Content-Type'
    return response