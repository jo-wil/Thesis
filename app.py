from flask import Flask
from flask import abort
from flask import request

from flask_sockets import Sockets

from gevent import pywsgi
from geventwebsocket.handler import WebSocketHandler
import werkzeug.serving

import json

from lib import jwt

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

@app.route('/api/login', methods=['POST'])
def login():
      if request.method == 'POST':
          data = json.loads(request.data)
          username = data.get('username')
          password = data.get('password')
          user = DB.get(username)
          # TODO do password correctly
          if user and user.get('password') == password: 
              return json.dumps({'token': jwt.encode({'username': username})}), 200
      abort(400)

@sockets.route('/socket')
def messaging(ws):
    username = ''
    while not ws.closed:
        try:
            data = ws.receive()
            json_data = json.loads(data)
            action = json_data.get('action')            
            token_data = jwt.decode(json_data.get('token')) 
            # TODO validate the token
            # TODO validate the input
            print 'token', token_data
            if token_data:
                print action
                if action == 'register':
                    username = token_data.get('username')
                    user = DB.get(username)
                    user['ws'] = ws
                    ws.send(json.dumps({'action': 'contacts', 'contacts': DB.keys()}))
                elif action == 'message':
                    to = json_data.get('to')
                    user = DB.get(to)
                    to_ws = user.get('ws')
                    to_ws.send(data) # todo filter what data gets sent
            # else TODO send you are not logged in?
        # TODO check which exception to catch, I think type error
        except:
            user = DB.get(username)
            user['ws'] = None
     
@werkzeug.serving.run_with_reloader
def main():
    app.debug = True
    server = pywsgi.WSGIServer(('', 8000), app, handler_class=WebSocketHandler)
    server.serve_forever()

if __name__ == '__main__':
    main()
