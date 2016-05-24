'use strict';

var jcrypt = (function () {

var jcrypt = {};

var crypto = window.crypto.subtle;
var random = function (bytes) {
    var array = new Uint8Array(bytes);
    window.crypto.getRandomValues(array);
    return utils.btob64(array);
};

var utils = {
   btos: function (array) {
      var string = '';
      for (var i = 0 ; i < array.length; i++) {
         string += String.fromCharCode(array[i]);
      }
      return string; 
   },
   stob: function (string) {
      var array = new Uint8Array(string.length);
      for (var i = 0; i < string.length; i++) {
         array[i] = string.charCodeAt(i);
      }
      return array;
   },
   btob64: function (array) {
      return window.btoa(utils.btos(array));
   },
   b64tob: function (string) {
      return utils.stob(window.atob(string));
   },
   stob64: function (string) {
      return window.btoa(string);
   },
   b64tos: function (string) {
      return window.atob(string);
   }
};

var aes = {
   IV_LEN: 12,
   encrypt: function (key, iv, plaintext) {
      key = utils.b64tob(key);
      iv = utils.b64tob(iv);
      plaintext = utils.stob(plaintext); 
      var promise = new Promise(function (resolve, reject) {
         crypto.importKey(
            'raw',
            key,
            { 
               name: 'AES-GCM'
            },
            true,
            ['encrypt', 'decrypt']
         )
         .then(function (result) {
            return crypto.encrypt({
               name: 'AES-GCM',
               iv: iv,
            }, result, plaintext);
         })
         .then(function (result) {
            result = new Uint8Array(result);
            let ciphertext = new Uint8Array(aes.IV_LEN + result.length);
            ciphertext.set(iv, 0);
            ciphertext.set(result, aes.IV_LEN);
            resolve(utils.btob64(ciphertext));
         });   
      });
      return promise;
   },
   decrypt: function (key, ciphertext) {
     ciphertext = new Uint8Array(utils.b64tob(ciphertext));
     var iv = ciphertext.slice(0, aes.IV_LEN);
     ciphertext = ciphertext.slice(aes.IV_LEN, ciphertext.length); 
     key = utils.b64tob(key);
     var promise = new Promise(function (resolve, reject) {
         crypto.importKey(
            'raw',
            key,
            { 
               name: 'AES-GCM'
            },
            true,
            ['encrypt', 'decrypt']   
         )
         .then(function (result) {
            return crypto.decrypt({
               name: 'AES-GCM',
               iv: iv,
            }, result, ciphertext);
         })
         .then(function (result) {
            resolve(utils.btos(new Uint8Array(result)));
         });
      });
      return promise;
   }
};

var sha256 = {
   hash: function (plaintext) {
      plaintext = utils.stob(plaintext);
      var promise = new Promise(function (resolve, reject) {
         crypto.digest({
            name: 'SHA-256'
         }, plaintext)
         .then(function (result) {
            resolve(utils.btob64(new Uint8Array(result)));
         }); 
      });
      return promise;
   }
};

var hmac = {};

var ecdh = {
   generate: function () {
      var promise = new Promise(function (resolve, reject) {
         crypto.generateKey({
            name: 'ECDH',
            namedCurve: 'P-256'
         }, true, ['deriveKey', 'deriveBits'])
         .then(function (result) {
            var exportKeys = [
               crypto.exportKey(
                  'jwk',
                  result.publicKey
               ),
               crypto.exportKey(
                  'jwk',
                  result.privateKey
               )
            ];
            return Promise.all(exportKeys); 
         })
         .then(function (result) {
            resolve({
               publicKey: utils.stob64(JSON.stringify(result[0])),
               privateKey: utils.stob64(JSON.stringify(result[1])),
            });
         });
      });
      return promise;
   },
   derive: function (publicKey, privateKey) {
      var promise = new Promise(function (resolve, reject) {
         var importKeys = [
            crypto.importKey('jwk', JSON.parse(utils.b64tos(publicKey)), {
               name: 'ECDH',
               namedCurve: 'P-256'
            }, true, []),
            crypto.importKey('jwk', JSON.parse(utils.b64tos(privateKey)), {
               name: 'ECDH',
               namedCurve: 'P-256'
            }, true, ['deriveKey', 'deriveBits'])
         ];
         Promise.all(importKeys)
         .then(function (result) {
            return crypto.deriveBits({
               name: 'ECDH',
               namedCurve: 'P-256',
               public: result[0]
            }, result[1], 128);
         })
         .then(function (result) {
            resolve(utils.btob64(new Uint8Array(result)));
         });
      });
      return promise;
   } 
};

var ecdsa = {};

jcrypt.random = random;
jcrypt.aes = aes;
jcrypt.sha256 = sha256;
jcrypt.ecdh = ecdh;

return jcrypt;

})();
