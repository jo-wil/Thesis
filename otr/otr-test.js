'use strict';

(function () {

var test = function (name, result, expected) {
   if (expected !== result) {
      console.log(
         name + '... fail\n' +
         '   result: ' + result + '\n' +
         '   expected: ' + expected
      );
      return;
   }
   console.log(name + '... pass');
};

var testnot = function (name, result, notexpected) {
   if (notexpected === result) {
      console.log(
         name + '... fail\n' +
         '   result: ' + result + '\n' +
         '   notexpected: ' + notexpected
      );
      return;
   }
   console.log(name + '... pass');
}

var alice = {};
var bob = {};
var network = {};

// Alice and Bob's long-term authentication public keys are pubA and pubB, respectively.
Promise.all([
   jc.ecdh.generate(),
   jc.ecdh.generate()
]).then(function (result) {
   alice.A = result[0];
   bob.B = result[1];
});

var keys;

/*otr.ake1(bob, network)
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


Promise.all([
jc.ecdh.generate(),
jc.ecdh.generate()
])
.then(function (result) {
   alice.dh = result[0];
   bob.dh = result[1];
   alice.pdh = bob.dh.publicKey;
   bob.pdh = alice.dh.publicKey;
   return otr.ed1('abc123', alice, network)
})
.then(function (result) {
   return otr.ed2(bob, network); 
})
.then(function (result) {
   test('ed aeskeys', bob.keys.sendAesKey, alice.keys.recvAesKey); 
   test('ed aeskeys', alice.keys.sendAesKey, bob.keys.recvAesKey); 
   test('ed mackeys', bob.keys.sendMacKey, alice.keys.recvMacKey); 
   test('ed mackeys', alice.keys.sendMacKey, bob.keys.recvMacKey); 
   test('ed msg', 'abc123', result);
});

})();
