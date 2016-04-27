'use strict';

// Regular class
class Convo {
   /*
   ----- msg states -----
   0: 'MSGSTATE_PLAINTEXT',
   1: 'MSGSTATE_ENCRYPTED',
   2: 'MSGSTATE_FINISHED'
   ----- auth states -----
   0: 'AUTHSTATE_NONE',
   1: 'AUTHSTATE_AWAITING_DHKEY',
   2: 'AUTHSTATE_AWAITING_REVEALSIG',
   3: 'AUTHSTATE_AWAITING_SIG'
   */
   constructor() {
      this._state = {
         auth: 'AUTHSTATE_NONE',
         msg: 'MSGSTATE_PLAINTEXT'
      };
      this._data = {};
   }

   nextSend (data) {
      return this.__proto__['_'+this._state.msg].call(this, 'send', data);
   }

   nextRecieve (data) {
      return this.__proto__['_'+this._state.msg].call(this, 'recieve', data);
   }

   _MSGSTATE_PLAINTEXT (type, data) {
      return this.__proto__['_'+this._state.auth].call(this, type, data);
   }

   __MSGSTATE_ENCRYPTED (type, data) {
      // TODO this is where the message will actually be encryped
   }

   _AUTHSTATE_NONE (type, data) {
      let promise;
      if (type === 'send') { 
         promise = new Promise(function (resolve, reject) {
            let r, gx;
            
            // Picks a random value r (128 bits)
            let pickR = function () {
               return window.crypto.subtle.generateKey(
                  {
                     name: 'AES-CTR',
                     length: 128
                  },
                  true,
                  ['encrypt', 'decrypt']
               );
            }.bind(this);  

            // Picks a random value x (at least 320 bits)
            let pickGX = function () {
               return window.crypto.subtle.generateKey(
                  {
                     name: 'ECDH',
                     namedCurve: 'P-256'
                  },
                  true,
                  ['deriveKey', 'deriveBits']
               );
            }.bind(this);

            let encryptGX = function (r, gx) {
               let encoder = new TextEncoder();
               let plaintext = encoder.encode(gx);
               let counter = new Uint8Array(16);
               counter[0] = 0;
               return window.crypto.subtle.encrypt(
                  {
                     name: "AES-CTR",
                     counter: counter,
                     length: 128
                  },
                  r,
                  plaintext 
               )   
            }.bind(this);

            Promise.all([pickR(), pickGX()])
            .then(function (results) {
               r = results[0];
               gx = results[1];
               this._data.r = r;
               this._data.gx = gx;
               // Export GX, todo encrypt 
               return window.crypto.subtle.exportKey(
                  'jwk',
                  gx.publicKey
               );
            }.bind(this)).then(function (result) {
               return Promise.all([encryptGX(this._data.r, JSON.stringify(result))]);
            }.bind(this)).then(function (results) {
               let otr = {};
               let decoder = new TextDecoder();
               otr.test = decoder.decode(new Uint8Array(results[0])); 
               data.otr = otr;
               resolve(data);
            }.bind(this));
         }.bind(this));
      }
      if (type === 'recieve') {
         promise = new Promise(function (resolve, reject) {
            let gy;
            let pickGY = window.crypto.subtle.generateKey(
               {
                  name: 'ECDH',
                  namedCurve: 'P-256'
               },
               true,
               ['deriveKey', 'deriveBits']
            );
            pickGY.then(function (result) {
               gy = result;
               this._data.gy = gy;
               return window.crypto.subtle.exportKey(
                  'jwk',
                  gy.publicKey
               );
            }.bind(this)).then(function (result) {
               let encoder = new TextEncoder();
               console.log('test', encoder.encode(data.otr.test));
               let otr = {};
               otr.gy = result; 
               data.otr = otr;
               resolve(data);
            }.bind(this));
         }.bind(this)); 
      }
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
