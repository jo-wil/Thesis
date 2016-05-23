'use strict';

var jcrypt = (function () {

var jcrypt = {};

var crypto = window.crypto.subtle;
var random = function (bytes) {
    var array = new Uint8Array(bytes);
    window.crypto.getRandomValues(array);
    return utils.btos(array);
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
   }
};

var AES = {
   encrypt: function (key, plaintext, auth) {
      var iv = utils.stob(random(16));
      key = utils.stob(key);
      plaintext = utils.stob(plaintext); 
      if (auth) {
         auth = utils.stob(auth)
      } else {
         auth = new Uint8Array(0);
      }
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
               additionalData: auth
            }, result, plaintext);
         })
         .then(function (result) {
            result = new Uint8Array(result);
            let ciphertext = new Uint8Array(iv.length + result.length);
            ciphertext.set(iv, 0);
            ciphertext.set(result, 16);
            resolve(utils.btos(ciphertext));
         });   
      });
      return promise;
   },
   decrypt: function (key, ciphertext, auth) {
     ciphertext = new Uint8Array(utils.stob(ciphertext));
     var iv = ciphertext.slice(0, 16);
     ciphertext = ciphertext.slice(16, ciphertext.length); 
     key = utils.stob(key);
     if (auth) {
        auth = utils.stob(auth)
     } else {
        auth = new Uint8Array(0);
     }
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
               additionalData: auth
            }, result, ciphertext);
         })
         .then(function (result) {
            resolve(utils.btos(new Uint8Array(result)));
         });
      });
      return promise;
   }
};

var SHA256 = {};

var HMAC = {};

var ECDH = {};

var ECDSA = {};

// Tests
var testGenerateKey = function () {
   var key = random(16);
   if (typeof key === 'string' &&
      key.length === 16) {
      console.log('pass'); 
   } else {
      throw 'fail';
   }
}
var testAESencryptdecrypt = function () {
   var key = utils.btos(random(16));
   var auth = utils.btos(random(16));
   AES.encrypt(key, 'secret message', auth)
   .then(function (result) {
      return AES.decrypt(key, result, auth);
   })
   .then(function (result) {
      if (result === 'secret message') {
         console.log('pass'); 
      } else {
         throw 'fail'; 
      }
   });
}
testGenerateKey();
testAESencryptdecrypt();

jcrypt.utils = utils;
jcrypt.random = random;
jcrypt.AES = AES;

return jcrypt;

})();
