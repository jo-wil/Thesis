'use strict';

// Regular class
class Convo {
  constructor() {
      this._crypto = new Crypto();
      this._state = {
         auth: 'AUTHSTATE_NONE',
         msg: 'MSGSTATE_PLAINTEXT'
      };
      this._data = {};
   }

   nextSend (data) {
        let promise = new Promise(function(resolve, reject) {
           resolve(data);
        });
        return promise;
//      return this.__proto__['_'+this._state.msg].call(this, 'send', data);
   }

   nextRecieve (data) {
        let promise = new Promise(function(resolve, reject) {
           resolve(data);
        });
        return promise;
//      return this.__proto__['_'+this._state.msg].call(this, 'recieve', data);
   }

   _MSGSTATE_PLAINTEXT (type, data) {
//      return this.__proto__['_'+this._state.auth].call(this, type, data);
   }

   __MSGSTATE_ENCRYPTED (type, data) {
      // TODO this is where the message will actually be encryped
   }
   _AUTHSTATE_NONE (type, data) {
   }
   
   _AUTHSTATE_AWAITING_DHKEY (type, data) {
   }

   _AUTHSTATE_AWAITING_REVEALSIG (type, data) {
    }

   _AUTHSTATE_AWAITING_SIG (type, data) {
    }
}

// Singleton class
class Otr {
   constructor () {
      this._convos = {};
   }

   static get instance() {
      if (!this._instance) {
         this._instance = new Otr();
      } 
      return this._instance;
   }

   send (data) {
      if (!this._convos[data.to]) {
         this._convos[data.to] = new Convo();
      }
      return this._convos[data.to].nextSend(data);
   }

   recieve (data) {
      if (!this._convos[data.from]) {
         this._convos[data.from] = new Convo();
      }
      return this._convos[data.from].nextRecieve(data);
   }      
}
