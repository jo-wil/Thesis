'use strict';

// Regular class
class Convo {
   constructor() {
      this._authStates = {
         0: 'AUTHSTATE_NONE',
         1: 'AUTHSTATE_AWAITING_DHKEY',
         2: 'AUTHSTATE_AWAITING_REVEALSIG',
         3: 'AUTHSTATE_AWAITING_SIG'
      };
      this._msgStates = {
         0: 'MSGSTATE_PLAINTEXT',
         1: 'MSGSTATE_ENCRYPTED',
         2: 'MSGSTATE_FINISHED'
      };
      this._state = {
         auth: 0,
         msg: 0
      }
   }
   next () {
      console.log(this._state);
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

   static hton (array) {
      var tmp = [];
      for (var i = 0; i < array.length; i++) {
         tmp.push(array[i]);
      }
      return tmp;
   }

   static ntoh (array) {
      var tmp = new Uint8Array(array.length);
      for (var i = 0; i < array.length; i++) {
         tmp[i] = array[i];
      }
      return tmp;
   }

   send (data, ws) {
      var convo = this._convos[data.to] || new Convo();
      var promise = new Promise(function (resolve, reject) {
         // TODO figure out this async stuff
         resolve(data);
      });
      this._convos[data.to] = convo;
      return promise;
   }

   recieve (data) {
      var convo = this._convos[data.from] || new Convo();
      var promise = new Promise(function (resolve, reject) {
         console.log(convo);
         resolve(data);
      });
      this._convos[data.from] = convo;
      return promise;
   }      
}
