from flask import Flask
from flask import abort
from flask import request

from flask_sockets import Sockets

from gevent import pywsgi
from geventwebsocket.handler import WebSocketHandler
import werkzeug.serving

from Crypto.Protocol import KDF
from Crypto.Hash import HMAC
from Crypto.Hash import SHA256

import os
import json
import base64

app = Flask(__name__)
sockets = Sockets(app)

DB = {}
KEY = b'changeme'

def encode(data):                                    
    global KEY              
    header = base64.urlsafe_b64encode(json.dumps({'alg': 'HS256', 'typ': 'JWT'})) 
    payload = base64.urlsafe_b64encode(json.dumps(data))                        
    signature = base64.urlsafe_b64encode(HMAC.new(KEY, msg=header+payload, digestmod=SHA256).hexdigest())
    jwt = header + '.' + payload + '.' + signature                              
    return jwt

def decode(token):
    global KEY                                                              
    token = token.split('.')                                                    
    if len(token) != 3:                                                         
        return None                                                             
    header = str(token[0])                                                      
    payload = str(token[1])                                                     
    signature = base64.urlsafe_b64decode(str(token[2]))                         
    test = HMAC.new(KEY, msg=header+payload, digestmod=SHA256).hexdigest()                       
    if signature != test:                                                       
        return None                                                             
    payload = json.loads(base64.urlsafe_b64decode(payload))                                 
    return payload  

@app.route('/')
def index():
   f = open('./static/index.html')
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
  if user and user.get('password').split('.')[1] == KDF.PBKDF2(password, user.get('password').split('.')[0], 16, 10000, lambda password, salt: HMAC.new(password, salt, SHA256).hexdigest()): 
     return json.dumps({'token': encode({'username': username})}), 200
  abort(400)

@app.route('/api/signup', methods=['POST'])
def signup():
  if request.method == 'POST':
     data = json.loads(request.data)
     username = data.get('username')
     password = data.get('password')
     user = DB.get(username)
     if user:
        abort(400)
     salt = os.urandom(8)
     DB[username] = {
        'password': salt + '.' + KDF.PBKDF2(password, salt, 16, 10000, lambda password, salt: HMAC.new(password, salt, SHA256).hexdigest()),
        'websocket': None,
        'publicKey': None
     }
     return '', 200      
  abort(400)

@sockets.route('/socket')
def messaging(websocket):
   username = ''
   while not websocket.closed:
      try:
         data = websocket.receive()
         json_data = json.loads(data)
         action = json_data.get('action')     
         if 'token' in json_data:    
            token_data = decode(json_data.get('token')) 
            if token_data:
               if action == 'register':
                  username = token_data.get('username')
                  user = DB.get(username)
                  user['websocket'] = websocket
                  user['publicKey'] = json_data.get('publicKey')
                  contacts = []
                  for key in DB:
                     contacts.append({
                        'username': key,
                        'publicKey': DB[key]['publicKey']   
                     })
                  for key in DB:
                     if key != username:
                        other_websocket = DB[key]['websocket']
                        if other_websocket:
                           other_websocket.send(json.dumps({'action': action, 'contacts': contacts}))
                  websocket.send(json.dumps({'action': action, 'contacts': contacts}))
               elif action == 'message':
                  to = json_data.get('to')
                  user = DB.get(to)
                  to_websocket = user.get('websocket')
                  if to_websocket:
                     del json_data['token']
                     #print json_data
                     to_websocket.send(json.dumps(json_data))
                  else:
                     websocket.send(json.dumps({'action': action, 'error': 'unavailable'}))
            else:
               websocket.send(json.dumps({'action': action, 'error': 'auth invalid token'}))
         else:
            websocket.send(json.dumps({'action': action, 'error': 'auth no token'}))
      except TypeError:
         user = DB.get(username)
         user['websocket'] = None
         # TODO if time, inform users of offline status

@werkzeug.serving.run_with_reloader
def main():
   app.debug = True
   server = pywsgi.WSGIServer(('', 8000), app, handler_class=WebSocketHandler)
   server.serve_forever()

if __name__ == '__main__':
   main()
