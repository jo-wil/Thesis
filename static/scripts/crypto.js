'use strict';

/**
 * This class aims to wrap the native WebCrypto API with sensible defaults. 
 * All of the API is still available to the user of this class.
 */
class Crypto {

   /*static toBuffer (data) {
      return (new TextEncoder('utf-8')).encode(data);
   }
   
   // TODO might have to deal with DataView if stuff breaks
   static toString (data) {
      return (new TextDecoder('utf-8')).decode(data);
   }*/
 
   constructor () {
      this._crypto = window.crypto.subtle; 
      if(!this._crypto) { 
         throw 'Crypto.constructor: WebCrpyto API unsupported';
      }
      this._state = {};
   }

   generateKey (algo, extractable, keyUsages) {
      if (!algo) {
         throw 'Crypto.generateKey: algo undefined';
      }
      if (!algo.name) { 
         throw 'Crypto.generateKey: algo.name undefined';
      }
      extractable = extractable || true;
      switch (algo.name) {
         case 'ECDH':
            algo.namedCurve = algo.namedCurve || 'P-256'; // TODO verify P-256 is okay
            keyUsages = keyUsages || ['deriveKey', 'deriveBits'];      
            break;
         case 'AES-CTR': // TODO possible fall through for all AES
            algo.length = algo.length || 128; // TODO verify 128 is okay
            keyUsages = keyUsages || ['encrypt', 'decrypt']; 
            break;
         default:
            throw 'Cryto.generateKey: algo.name unsupported';
            break;
      }
      return this._crypto.generateKey(algo, extractable, keyUsages);
   }

   importKey (format, keyData, algo, extractable, usages) {
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
      extractable = extractable || true;
      switch (algo.name) {
         case 'ECDH':
            algo.namedCurve = algo.namedCurve || 'P-256'; // TODO verify P-256 is okay
            usages = usages || ['deriveKey', 'deriveBits'];      
            break;
         case 'AES-CTR': // TODO possible fall through for all AES
            algo.length = algo.length || 128; // TODO verify 128 is okay
            usages = usages || ['encrypt', 'decrypt']; 
            break;
         default:
            throw 'Cryto.importKey: algo.name unsupported';
            break;
      }
      return this._crypto.importKey(format, keyData, algo, extractable, usages);
   }

   exportKey (format, key) {
      format = format || 'jwk';
      if (!key) {
         throw 'Crypto.exportKey: key undefined';
      }
      return this._crypto.exportKey(format, key); 
   }

   encrypt (algo, key, cleartext) {
      if (!algo) {
         throw 'Crypto.encrypt: algo undefined';
      }
      if (!algo.name) { 
         throw 'Crypto.encrypt: algo.name undefined';
      }
      switch (algo.name) {
         case 'AES-CTR':
            if (!algo.counter) {
               throw 'Crypto.encrypt: algo.counter undefined';
            }
            algo.length = algo.length || 128; // TODO verify 128 is okay https://www.w3.org/TR/WebCryptoAPI/#dfn-AesCtrParams
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
      return this._crypto.encrypt(algo, key, cleartext); 
   }

   decrypt (algo, key, ciphertext) {
      if (!algo) {
         throw 'Crypto.decrypt: algo undefined';
      }
      if (!algo.name) { 
         throw 'Crypto.decrypt: algo.name undefined';
      }
      switch (algo.name) {
         case 'AES-CTR':
            if (!algo.counter) {
               throw 'Crypto.decrypt: algo.counter undefined';
            }
            algo.length = algo.length || 128; // TODO verify 128 is okay https://www.w3.org/TR/WebCryptoAPI/#dfn-AesCtrParams
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
      return this._crypto.decrypt(algo, key, ciphertext); 
   }

   digest (algo, buffer) {
      algo = algo || {};
      if (!buffer) {
         throw 'Crypto.buffer: buffer undefined';
      }
      algo.name = algo.name || 'SHA-256'; // TODO verify this is an sensible default  
      return this._crypto.digest(algo, buffer);
   }
}
