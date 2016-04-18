from Crypto.Hash import HMAC
from Crypto.Hash import SHA256

import base64
import json

key = b'changeme'

def encode(data):                                                  
    header = base64.urlsafe_b64encode(json.dumps({'alg': 'HS256', 'typ': 'JWT'})) 
    payload = base64.urlsafe_b64encode(json.dumps(data))                        
    signature = base64.urlsafe_b64encode(HMAC.new(key, msg=header+payload, digestmod=SHA256).hexdigest())
    jwt = header + '.' + payload + '.' + signature                              
    return jwt

def decode(token):                                                              
    token = token.split('.')                                                    
    if len(token) != 3:                                                         
        return None                                                             
    header = str(token[0])                                                      
    payload = str(token[1])                                                     
    signature = base64.urlsafe_b64decode(str(token[2]))                         
    test = HMAC.new(key, msg=header+payload, digestmod=SHA256).hexdigest()                       
    if signature != test:                                                       
        return None                                                             
    payload = json.loads(base64.urlsafe_b64decode(payload))                                 
    return payload  
