'use strict';

var app = {};
app.globals = {};

var main = function main() {
   login.render(); 
};

window.addEventListener('load', main);

var global_key;
var global_iv = window.crypto.getRandomValues(new Uint8Array(16));
window.crypto.subtle.generateKey({
      name: "AES-CBC",
      length: 128, //can be  128, 192, or 256
   },
   true, //whether the key is extractable (i.e. can be used in exportKey)
   ["encrypt", "decrypt"] //can be "encrypt", "decrypt", "wrapKey", or "unwrapKey"
).then(function(key){
   //returns a key object
   global_key = key;
   var encoder = new TextEncoder();
   var plaintext = encoder.encode('this is a mesag');
   console.log('plaintext', plaintext);
   return window.crypto.subtle.encrypt({
         name: 'AES-CBC',
         //Don't re-use initialization vectors!
         //Always generate a new iv every time your encrypt!
         iv: global_iv,
      },
      global_key, //from generateKey or importKey above
      plaintext //ArrayBuffer of data you want to encrypt
   );
}).then(function (ciphertext) {
   console.log('iv', global_iv);
   console.log('ciphertext', new Uint8Array(ciphertext));
   var tmp = new Uint8Array(ciphertext).slice(0,16);
   console.log('tmp', tmp);
   return window.crypto.subtle.decrypt({
         name: 'AES-CBC',
         iv: global_iv, 
      },
      global_key,
      ciphertext
   );
}).then(function (plaintext) {
   console.log('plaintext', new Uint8Array(plaintext));
   var decoder = new TextDecoder();
   console.log('plaintext decoded', decoder.decode(plaintext)); 
}).catch(function(err){
   console.error(err);
});
