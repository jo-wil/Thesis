from flask import Flask
from flask import abort
from flask import request

from flask_sockets import Sockets

from gevent import pywsgi
from geventwebsocket.handler import WebSocketHandler
import werkzeug.serving

import json

app = Flask(__name__)
sockets = Sockets(app)

DB = {
    'Alice': {
        'password': '1234',
        'ws': None
    },
    'Bob': {
        'password': 'abc',
        'ws': None
    }
}

@app.route('/')
def index():
    f = open('index.html')
    html = f.read()
    f.close()
    return html, 200

@app.route('/api/login', methods=['GET','POST'])
def login():
      if request.method == 'GET':
          return json.dumps(DB), 200
      elif request.method == 'POST':
          data = json.loads(request.data)
          user = DB.get(data.get('username'))
          if user and user.get('password') == data.get('password'):
              return 'server_token', 200
      abort(400)

@sockets.route('/api/messaging')
def messaging(ws):
    while not ws.closed:
        json_data = json.loads(ws.receive())
        token = json_data.get('token')
        if token:
           # register the user socket
           username = json_data.get('username')
           if username:
              user = DB.get(username)
              user['ws'] = ws
           # send messages
           to = json_data.get('to')
           _from = json_data.get('from')
           text = json_data.get('text')
           if to and _from and text:
              user = DB.get(to)
              user_ws = user.get('ws')
              if user_ws:
                 user_ws.send(json.dumps({'from': _from, 'text': text})) 
     
@werkzeug.serving.run_with_reloader
def main():
    app.debug = True
    server = pywsgi.WSGIServer(('', 8000), app, handler_class=WebSocketHandler)
    server.serve_forever()

if __name__ == '__main__':
    main()
