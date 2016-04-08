from flask import Flask
from flask import abort
from flask import request

from flask_sockets import Sockets

from gevent import pywsgi
from geventwebsocket.handler import WebSocketHandler
import werkzeug.serving

import json
import functools

app = Flask(__name__)
sockets = Sockets(app)

DB = {
    'Alice': {
        'password': '1234'
    },
    'Bob': {
        'password': 'abc'
    }
}

def authenticated(old_func):
    @functools.wraps(old_func)
    def new_func(*args, **kwargs):
        token = flask.request.headers.get('Authorization')
        if token:
            token = token.replace('Bearer ','') 
            return old_func(*args, **kwargs)
        abort(400)
    return new_func

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
        message = ws.receive()
        print 'message', message
        ws.send(message)
#        if 'username' in message:
#           user_sockets[message['username']] = ws 
#           print user_sockets
#        else:
#           to = message['to']
#           user_sockets[to].send(json.dumps(message))

@werkzeug.serving.run_with_reloader
def main():
    app.debug = True
    server = pywsgi.WSGIServer(('', 8000), app, handler_class=WebSocketHandler)
    server.serve_forever()

if __name__ == '__main__':
    main()
