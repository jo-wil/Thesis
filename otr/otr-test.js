'use strict';

(function () {

var tests = {};

var test = function (name, result, expected) {
   var p = document.createElement('p');
   if (expected !== result) {
      p.innerText =
         name + '... fail\n' +
         '   result: ' + result + '\n' +
         '   expected: ' + expected;
      return;
   }
   p.innerText = name + '... pass';
   document.body.appendChild(p);
};

var testnot = function (name, result, notexpected) {
   var p = document.createElement('p');
   if (notexpected === result) {
      p.innerText = 
         name + '... fail\n' +
         '   result: ' + result + '\n' +
         '   notexpected: ' + notexpected;
      return;
   }
   p.innerText = name + '... pass';
   document.body.appendChild(p);
};

// Alice and Bob's long-term authentication public keys are pubA and pubB, respectively.
/*Promise.all([
   jc.ecdh.generate(),
   jc.ecdh.generate()
]).then(function (result) {
   alice.A = result[0];
   bob.B = result[1];
});

var keys;

otr.ake1(bob, network)
.then(function (result) {
   keys = Object.keys(bob);
   testnot('ake1 bob.r', keys.indexOf('r'), -1);
   testnot('ake1 bob.gx', keys.indexOf('gx'), -1);
   keys = Object.keys(network);
   testnot('ake1 network.aes_r_gx', keys.indexOf('aes_r_gx'), -1);
   testnot('ake1 network.hash_gx', keys.indexOf('hash_gx'), -1);
   return otr.ake2(alice, network); 
})
.then(function (result) {
   keys = Object.keys(alice);
   testnot('ake2 alice.gy', keys.indexOf('gy'), -1);
   keys = Object.keys(network);
   testnot('ake2 network.gy', keys.indexOf('gy'), -1);
   // pretend that we finished the key exchange
});*/

tests.ed = function () {
   
   var alice = {};
   alice.ourKeys = {};
   alice.ourKeyId = 2; 
   alice.theirKeys = {}; 
   var bob = {};
   bob.ourKeys = {}; 
   bob.ourKeyId = 2;
   bob.theirKeys = {}; 
   
   var network = {};
   
   Promise.all([
      jc.ecdh.generate(),
      jc.ecdh.generate(),
      jc.ecdh.generate(),
      jc.ecdh.generate()
   ])
   .then(function (result) {
      // Generate the DH keys
      alice.ourKeys[alice.ourKeyId - 1] = result[0];
      alice.ourKeys[alice.ourKeyId] = result[1];
      bob.ourKeys[bob.ourKeyId - 1] = result[2];
      bob.ourKeys[bob.ourKeyId] = result[3];
  
      // Pretend we did the AKE
      alice.theirKeyId = 1;     
      bob.theirKeyId = 1;
      alice.theirKeys[alice.theirKeyId] = bob.ourKeys[alice.theirKeyId].publicKey;
      bob.theirKeys[bob.theirKeyId] = alice.ourKeys[bob.theirKeyId].publicKey;
 
      // Send a message from alice to bob 
      return otr.ed1(alice, network, 'abc123');
   })
   .then(function (result) {
      return otr.ed2(bob, network); 
   })
   .then(function (result) {
      test('ed msg', 'abc123', result);
      console.log('alice', alice);
      console.log('bob', bob);
   });
};

// Run tests
var runtests = function () {
   var keys = Object.keys(tests);
   for (var i = 0; i < keys.length; i++) {
      tests[keys[i]]();
   }
};

window.addEventListener('load', runtests);

})();
