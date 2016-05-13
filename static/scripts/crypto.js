'use strict';

class Crypto {

   constructor () {
      if(!window.crypto.subtle) { 
        throw 'Crypto.constructor: WebCrypto API unsupported';
      }
      this.crypto = window.crypto.subtle; 
   }

   getRandomValues(bytes) {
      
      if (this._pure || (bytes instanceof Uint8Array)) {
         return window.crypto.getRandomValues(bytes);
      }
      return window.crypto.getRandomValues(new Uint8Array(bytes));
   }

   generateKey (options) {
      
      let algo = options.algo;
      let extractable = options.extractable;
      let keyUsages = options.extractable;
      
      if (!algo) {
         throw 'Crypto.generateKey: algo undefined';
      }
      if (!algo.name) { 
         throw 'Crypto.generateKey: algo.name undefined';
      }
      extractable = extractable || true;
      switch (algo.name) {
         case 'ECDH':
            algo.namedCurve = algo.namedCurve || 'P-256';
            keyUsages = keyUsages || ['deriveKey', 'deriveBits'];      
            break;
         case 'AES-GCM':
            algo.length = algo.length || 128;
            keyUsages = keyUsages || ['encrypt', 'decrypt']; 
            break;
         case 'HMAC':
            algo.hash = {name: 'SHA-256'};
            keyUsages = keyUsages || ['sign', 'verify']; 
            break;
         default:
            throw 'Cryto.generateKey: algo.name unsupported ' + algo.name;
            break;
      }
      
      let promise = new Promise(function (resolve, reject) { 
         this.crypto.generateKey(algo, extractable, keyUsages)
         .then(function (result) {
            switch (algo.name) {
               case 'ECDH':
                  return Promise.all([this.exportKey({key: result.publicKey}), crypto.exportKey({key: result.privateKey})]);
               case 'AES-GCM':
                  return this.exportKey({key: result});
               case 'HMAC':
                  return this.exportKey({key: result});
            }     
         }.bind(this)).then(function (result) {
            if (result.length === 2) {
               resolve({
                  publicKey: result[0],
                  privateKey: result[1]
               });
            } else {
               resolve(result);
            }
         }.bind(this));
      }.bind(this)); 
      return promise;
   }

   importKey (options) {

      let format  = options.format ;    
      let keyData = options.keyData ;    
      let algo = options.algo ;    
      let extractable = options.extractable ;    
      let usages = options.usages ;    
 
      format = format || 'jwk';
      if (!keyData) {
         throw 'Crypto.importKey: keyData undefined';
      }
      if (!algo) {
         throw 'Crypto.importKey: algo undefined';
      }
      if (!algo.name) { 
         throw 'Crypto.importKey: algo.name undefined';
      }
      switch (algo.name) {
         case 'ECDH':
            algo.namedCurve = algo.namedCurve || 'P-256'; 
            break;
         case 'AES-GCM': 
            algo.length = algo.length || 128; 
            break;
         case 'HMAC':
            algo.hash = {name: 'SHA-256'};
            break;
         default:
            throw 'Cryto.importKey: algo.name unsupported ' + algo.name;
            break;
      }
      extractable = extractable || true;
      usages = usages || keyData.key_ops; 
      return this.crypto.importKey(format, keyData, algo, extractable, usages);
   }

   exportKey (options) {
      
      let format = options.format;
      let key = options.key;

      format = format || 'jwk';
      if (!key) {
         throw 'Crypto.exportKey: key undefined';
      }
      return this.crypto.exportKey(format, key); 
   }

   deriveKey (options) {
      
      let algo = options.algo;
      let masterKey = options.masterKey;
      let derivedKeyAlgo = options.derivedKeyAlgo;
      let extractable = options.extractable;
      let keyUsages = options.keyUsages;

      if (!algo) {
         throw 'Crypto.deriveKey: algo undefined';
      }
      algo.name = algo.name || 'ECDH';
      algo.namedCurve = algo.namedCurve || 'P-256';
      if (!algo.public) {
         throw 'Crypto.deriveKey: algo.public undefined';
      }
      if (!masterKey) {
         throw 'Crypto.deriveKey: masterKey undefined';
      }
      derivedKeyAlgo = derivedKeyAlgo || {};
      derivedKeyAlgo.name = derivedKeyAlgo.name || 'AES-GCM';
      derivedKeyAlgo.length = derivedKeyAlgo.length || 128;
      extractable = extractable || true;
      keyUsages = keyUsages || ['encrypt', 'decrypt'];
      
      let promise = new Promise(function (resolve, reject) {
         Promise.all([
         this.importKey({
            algo: algo,
            keyData: algo.public             
         }),
         this.importKey({
            algo: algo,
            keyData: masterKey
         })
         ]).then(function (result) {
            algo.public = result[0];
            masterKey = result[1];
            return this.crypto.deriveKey(algo, masterKey, derivedKeyAlgo, extractable, keyUsages);
         }.bind(this)).then(function (result) {
            return this.exportKey({key: result});
         }.bind(this)).then(function (result) {
            resolve(result);
         }.bind(this));
      }.bind(this));
      return promise;
   }
   
   encrypt (options) {

      let algo = options.algo; 
      let key = options.key; 
      let cleartext = options.cleartext; 

      algo = algo || {};
      algo.name = algo.name || 'AES-GCM';
      switch (algo.name) {
         case 'AES-GCM':
            algo.iv = this.getRandomValues(new Uint8Array(16));
            algo.length = algo.length || 128; 
            break;
         default:
            throw 'Cryto.encrypt: algo.name unsupported';
            break;
      }
      if (!key) {
         throw 'Crypto.encrypt: key undefined';
      }
      if (!cleartext) {
         throw 'Crypto.encrypt: cleartext undefined';
      }
      cleartext = Utils.toArray(cleartext);      
 
      let promise = new Promise(function (resolve, reject) {
         this.importKey({
            keyData: key,
            algo: algo
         }).then(function (result) {
            return this.crypto.encrypt(algo, result, cleartext);
         }.bind(this)).then(function (result) {
            result = new Uint8Array(result);
            let ciphertext = new Uint8Array(algo.iv.length + result.length);
            ciphertext.set(algo.iv, 0);
            ciphertext.set(result, 16);
            resolve(btoa(Utils.toString(ciphertext)));
         }.bind(this));   
      }.bind(this));
      return promise;
   }

   decrypt (options) { 
      
      let algo = options.algo; 
      let key = options.key; 
      let ciphertext = Utils.toArray(atob(options.ciphertext)); 
 
      algo = algo || {};
      algo.name = algo.name || 'AES-GCM';
      switch (algo.name) {
         case 'AES-GCM':
            algo.iv = ciphertext.slice(0, 16)
            algo.length = algo.length || 128; 
            break;
         default:
            throw 'Cryto.decrypt: algo.name unsupported';
            break;
      }
      if (!key) {
         throw 'Crypto.decrypt: key undefined';
      }
      if (!ciphertext) {
         throw 'Crypto.decrypt: ciphertext undefined';
      } 
      let promise = new Promise(function (resolve, reject) {
         this.importKey({
            keyData: key,
            algo: algo
         }).then(function (result) {
            return this.crypto.decrypt(algo, result, ciphertext.slice(16, ciphertext.length));
         }.bind(this)).then(function (result) {
            resolve(Utils.toString(new Uint8Array(result)));
         }.bind(this));   
      }.bind(this));
      return promise;

   }

   digest (options) {

      let algo = options.algo;
      let buffer = options.buffer;

      algo = algo || {};
      if (!buffer) {
         throw 'Crypto.buffer: buffer undefined';
      }
      algo.name = algo.name || 'SHA-256'; 
      buffer = Utils.toArray(buffer);

      let promise = new Promise(function (resolve, reject) {
         this.crypto.digest(algo, buffer)
         .then(function (result) {
            resolve(btoa(Utils.toString(new Uint8Array(result))));   
         }.bind(this));
      }.bind(this));
      return promise;
   }
}
