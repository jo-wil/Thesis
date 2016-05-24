'use strict';

(function () {

var alice = {};
var bob = {};
var network = {};

// Alice and Bob's long-term authentication public keys are pubA and pubB, respectively.
Promise.all([
   jcrypt.ecdh.generate(),
   jcrypt.ecdh.generate()
]).then(function (result) {
   alice.A = result[0];
   bob.B = result[1];
});

var ake1 = function () {
   var promise = new Promise(function (resolve, reject) {
      // Picks a random value r (128 bits)
      bob.r = jcrypt.random(16);
      // Picks a random value x (at least 320 bits)
      jcrypt.ecdh.generate()
      .then(function (result) {
         bob.gx = result;
         var iv = jcrypt.random(12);
         // Sends Alice AESr(gx), HASH(gx)
         return Promise.all([ 
            jcrypt.aes.encrypt(bob.r, iv, bob.gx.publicKey),
            jcrypt.sha256.hash(bob.gx.publicKey)
         ]);
      })
      .then(function (result) {
         network = {}; 
         network.AES_r_gx = result[0];
         network.HASH_gx = result[1];
         resolve();
      });
   });
   return promise;
};

var ake2 = function () {

   var promise = new Promise(function (resolve, reject) {
      // Picks a random value y (at least 320 bits)
      jcrypt.ecdh.generate()
      .then(function (result) {
         alice.gy = result;
         network = {}; 
         network.gy = alice.gy.publicKey;
         resolve();
      });
       
   });
   return promise;
};

var ake3 = function () {};
var ake4 = function () {};
var ake5 = function () {};

// Run
ake1()
.then(function (result) {
   return ake2(); 
})
.then(function (result) {
});

})();
