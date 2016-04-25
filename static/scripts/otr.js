'use strict';

// Regular class
class Convo {
   /*
   ----- auth states -----
   0: 'AUTHSTATE_NONE',
   1: 'AUTHSTATE_AWAITING_DHKEY',
   2: 'AUTHSTATE_AWAITING_REVEALSIG',
   3: 'AUTHSTATE_AWAITING_SIG'
   ----- msg states -----
   0: 'MSGSTATE_PLAINTEXT',
   1: 'MSGSTATE_ENCRYPTED',
   2: 'MSGSTATE_FINISHED'
   */

   constructor() {
      this._state = {
         auth: 0,
         msg: 0
      }
   }

   nextSend (data) {
      let promise;
      switch (this._state.msg) {
         case 0:
            switch (this._state.auth) {
               case 0:
                  promise = this._sendAuthStateNone(data);
                  break; 
               case 1:
                  break; 
               case 2:
                  break; 
               case 3:
                  break; 
            }
            break;
         case 1:
            break;
         case 2:
            break;
         default:
            throw "Error in send state machine"
            break;
      }
      return promise;
   }

   nextRecieve (data) {
      let promise;
      switch (this._state.msg) {
         case 0:
            switch (this._state.auth) {
               case 0:
                  promise = this._recieveAuthStateNone(data);
                  break; 
               case 1:
                  break; 
               case 2:
                  break; 
               case 3:
                  break; 
            }
            break;
         case 1:
            break;
         case 2:
            break;
         default:
            throw "Error in send state machine"
            break;
      }
      return promise; 
   }

   _sendAuthStateNone (data) {
      var promise = new Promise(function (resolve, reject) {
         let r, gx;
         // Picks a random value r (128 bits)
         let pickR = window.crypto.subtle.generateKey(
            {
               name: 'AES-CTR',
               length: 128
            },
            true,
            ['encrypt', 'decrypt']
         );
         let pickGX = window.crypto.subtle.generateKey(
            {
               name: 'ECDH',
               namedCurve: 'P-256'
            },
            true,
            ['deriveKey', 'deriveBits']
         );

         Promise.all([pickR, pickGX])
         .then(function (results) {
            r = results[0];
            gx = results[1];
            // Export GX, todo encrypt 
            return window.crypto.subtle.exportKey(
               'jwk',
               gx.publicKey
            );
         }).then(function (keydata) {
            console.log(keydata);
            var otr = {};
            otr.gx = keydata; 
            data.otr = otr;
            resolve(data);
         });
      });
      return promise;
   }
   _recieveAuthStateNone (data) {
      var promise = new Promise (function (resolve, reject) {
         resolve(data);
      });
      return promise;
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
