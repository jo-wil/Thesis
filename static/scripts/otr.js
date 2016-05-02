'use strict';

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

// TODO ask Peterson about this, utf-8 vs utf-16
const encoder = new TextEncoder('utf-16');
const decoder = new TextDecoder('utf-16', {fatal: true});

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
      console.log('AUTHSTATE_NONE', type, data); 
      let promise;
      if (type === 'send') { 
         promise = new Promise(function (resolve, reject) {
            // Picks a random value r (128 bits)
            let pickR = this._crypto.generateKey({name: 'AES-CTR'});
            // Picks a random value x (at least 320 bits)
            let pickGX = this._crypto.generateKey({name: 'ECDH'});
            
            Promise.all([pickR, pickGX])
            .then(function (results) {
               this._data.r = results[0];
               this._data.gx = results[1];
               return this._crypto.exportKey('jwk', this._data.gx.publicKey); 
            }.bind(this)).then(function (result) {
               let encryptGX = this._crypto.encrypt({
                  name: 'AES-CTR',
                  counter: new Uint8Array(16)
               }, this._data.r, (encoder.encode(JSON.stringify(result))));
               let hashGX = this._crypto.digest({}, encoder.encode(JSON.stringify(result))); 
               return Promise.all([encryptGX, hashGX]);
            }.bind(this)).then(function (results) {
               let otr = {};
               console.log(new Uint8Array(results[0]));
               console.log(new Uint8Array(results[1]));
               otr.aes_r_gx = decoder.decode(results[0]); 
               otr.hash_gx = decoder.decode(results[1]);
               data.otr = otr;
               this._state.auth = 'AUTHSTATE_AWAITING_DHKEY';
               resolve(data);
            }.bind(this));
         }.bind(this));
      }
      if (type === 'recieve') {
         promise = new Promise(function (resolve, reject) {
            let pickGY = this._crypto.generateKey({name: 'ECDH'});
            pickGY.then(function (result) {
               this._data.gy = result;
               return this._crypto.exportKey('jwk', this._data.gy.publicKey);
            }.bind(this)).then(function (result) {
               let otr = {};
               otr.gy = result; 
               data.otr = otr;
               this._state.auth = 'AUTHSTATE_AWAITING_REVEALSIG';
               resolve(data);
            }.bind(this));
         }.bind(this)); 
      }
      return promise;
   }
   
   _AUTHSTATE_AWAITING_DHKEY (type, data) {
      console.log('AUTHSTATE_AWAITING_DHKEY', type, data); 
      if (type === 'send') {
      }
      if (type === 'recieve') {
         let otr = data.otr;
         console.log(encoder.encode(otr.aes_r_gx));
         console.log(encoder.encode(otr.hash_gx));
      }
   }

   _AUTHSTATE_AWAITING_REVEALSIG (type, data) {
      console.log('AUTHSTATE_AWAITING_REVEALSIG', type, data); 
      if (type === 'send') {
      }
      if (type === 'recieve') {
      }
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
