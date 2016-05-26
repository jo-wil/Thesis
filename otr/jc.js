'use strict';

var jc = (function () {

var jc = {};

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

var aes = {};

aes.ctr = {
   encrypt: function (key, ctr, plaintext) {
      key = utils.b64tob(key);
      ctr = utils.b64tob(ctr);
      plaintext = utils.stob(plaintext); 
      var promise = new Promise(function (resolve, reject) {
         crypto.importKey('raw', key, { 
            name: 'AES-CTR'
         }, true, ['encrypt', 'decrypt'])
         .then(function (result) {
            return crypto.encrypt({
               name: 'AES-CTR',
               counter: ctr,
               length: 128,
            }, result, plaintext);
         })
         .then(function (result) {
            result = new Uint8Array(result);
            let ciphertext = new Uint8Array(16 + result.length);
            ciphertext.set(ctr, 0);
            ciphertext.set(result, 16);
            resolve(utils.btob64(ciphertext));
         });   
      });
      return promise;
   },
   decrypt: function (key, ciphertext) {
     ciphertext = new Uint8Array(utils.b64tob(ciphertext));
     var ctr = ciphertext.slice(0, 16);
     ciphertext = ciphertext.slice(16, ciphertext.length); 
     key = utils.b64tob(key);
     var promise = new Promise(function (resolve, reject) {
         crypto.importKey('raw', key, { 
            name: 'AES-CTR'
         }, true, ['encrypt', 'decrypt'])
         .then(function (result) {
            return crypto.decrypt({
               name: 'AES-CTR',
               counter: ctr,
               length: 128,
            }, result, ciphertext);
         })
         .then(function (result) {
            resolve(utils.btos(new Uint8Array(result)));
         });
      });
      return promise;
   }
};

var hash = {
   sha1: function (plaintext) {
      plaintext = utils.stob(plaintext);
      var promise = new Promise(function (resolve, reject) {
         crypto.digest({
            name: 'SHA-1'
         }, plaintext)
         .then(function (result) {
            resolve(utils.btob64(new Uint8Array(result)));
         }); 
      });
      return promise;
   },   
   sha256: function (plaintext) {
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

var hmac = {
   sign: function (key, plaintext) {
      var promise = new Promise(function (resolve, reject) {
         crypto.importKey('raw', utils.b64tob(key), {
            name: 'HMAC',
            hash: {name: 'SHA-256'}
         }, true, ['sign', 'verify'])
         .then(function (result) {
            return crypto.sign({
               name: 'HMAC'
            }, result, utils.stob(plaintext));
         })
         .then(function (result) {
            resolve(utils.btob64(new Uint8Array(result)));
         });     
      });
      return promise;
   }, 
   verify: function (key, plaintext, signature) {
      var promise = new Promise(function (resolve, reject) {
         crypto.importKey('raw', utils.b64tob(key), {
            name: 'HMAC',
            hash: {name: 'SHA-256'}
         }, true, ['sign', 'verify'])
         .then(function (result) {
            return crypto.verify({
               name: 'HMAC'
            }, result, utils.b64tob(signature), utils.stob(plaintext));
         })
         .then(function (result) {
            resolve(result);
         });
      });
      return promise;
   }
};

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

var ecdsa = {
   generate: function () {
      var promise = new Promise(function (resolve, reject) {
         crypto.generateKey({
            name: 'ECDSA',
            namedCurve: 'P-256'
         }, true, ['sign', 'verify'])
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
   sign: function (key, plaintext) {
      var promise = new Promise(function (resolve, reject) {
         crypto.importKey('jwk', JSON.parse(utils.b64tos(key)), {
            name: 'ECDSA',
            namedCurve: 'P-256'   
         }, true, ['sign'])
         .then(function (result) {
            return crypto.sign({
               name: 'ECDSA',
               hash: {name: 'SHA-256'}
            }, result, utils.stob(plaintext));
         }).then(function (result) {
            resolve(utils.btob64(new Uint8Array(result)));
         });
      });
      return promise;
   },
   verify: function (key, plaintext, signature) {
      var promise = new Promise(function (resolve, reject) {
         crypto.importKey('jwk', JSON.parse(utils.b64tos(key)), {
            name: 'ECDSA',
            namedCurve: 'P-256'   
         }, true, ['verify'])
         .then(function (result) {
            return crypto.verify({
               name: 'ECDSA',
               hash: {name: 'SHA-256'}
            }, result, utils.b64tob(signature), utils.stob(plaintext));
         }).then(function (result) {
            resolve(result);
         });
      });
      return promise;
   }
};

jc.utils = utils;
jc.random = random;
jc.aes = aes;
jc.hash = hash;
jc.hmac = hmac;
jc.ecdh = ecdh;
jc.ecdsa = ecdsa;

return jc;

})();
