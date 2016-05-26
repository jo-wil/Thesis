'use strict';

(function () {

var tests = {};

var test = function (name, expected, result) {
   if (expected !== result) {
      console.log(
         name + '... fail\n' +
         '   expected: ' + expected + '\n' +
         '   result: ' + result
      );
      return;
   }
   console.log(name + '... pass');
};

tests.gen = function () {
   var key = jc.random(16);
   test('genLength', Math.ceil(16/ 3) * 4, key.length); 
   test('genType', 'string', typeof key); 
};

tests.aes = function () {
   var key = jc.random(16);
   var ctr = jc.random(16);
   jc.aes.ctr.encrypt(key, ctr, 'secret message')
   .then(function (result) {
      return jc.aes.ctr.decrypt(key, result);
   })
   .then(function (result) {
      test('aes.ctr.encryptDecrypt', result, 'secret message');
   });
};

tests.sha1 = function () {
   jc.hash.sha1('abc')
   .then(function (result) {
      test('hash.sha1"abc"', result, 'qZk+NkcGgWq6PiVxeFDCbJzQ2J0=')
   });
};

tests.sha256 = function () {
   jc.hash.sha256('abc')
   .then(function (result) {
      test('hash.sha256"abc"', result, 'ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=')
   });
};

tests.hmac = function () {
   var key = jc.random(32);
   jc.hmac.sign(key, 'important message')
   .then(function (result) {
      return Promise.all([
         jc.hmac.verify(key, 'important message', result),
         jc.hmac.verify(key, 'important message changed', result)
      ]);
   })
   .then(function (result) {
      test('hmacSignVerifyGood', true, result[0]);
      test('hmacSignVerifyBad', false, result[1]);
   }); 
};


tests.ecdh = function () {
   jc.ecdh.generate()
   .then(function (result) {
      var keys = Object.keys(result);
      test('ecdhGenPublic', keys[0], 'publicKey');
      test('ecdhGenPrivate', keys[1], 'privateKey');
   });

   jc.ecdh.generate()
   .then(function (result) {
      return jc.ecdh.derive(result.publicKey, result.privateKey);
   })
   .then(function (result) {
      test('ecdhDeriveOneLength', Math.ceil(16/ 3) * 4, result.length); 
      test('ecdhDeriveOneType', 'string',  typeof result); 
   });

   Promise.all([
   jc.ecdh.generate(),
   jc.ecdh.generate()]) 
   .then(function (result) {
      return jc.ecdh.derive(result[0].publicKey, result[1].privateKey);
   })
   .then(function (result) {
      test('ecdhDeriveTwoLength', Math.ceil(16/ 3) * 4, result.length); 
      test('ecdhDeriveTwoType', 'string',  typeof result); 
   });

};

tests.ecdsa = function () {

   var key;
   jc.ecdsa.generate()
   .then(function (result) {
      key = result;
      return jc.ecdsa.sign(key.privateKey, 'important message');
   })
   .then(function (result) {
      return Promise.all([
         jc.ecdsa.verify(key.publicKey, 'important message', result),
         jc.ecdsa.verify(key.publicKey, 'important message changed', result)
      ]);
   })
   .then(function (result) {
      test('ecdsaSignVerifyGood', true, result[0]);
      test('ecdsaSignVerifyBad', false, result[1]);
   });  

};

// Run tests
var keys = Object.keys(tests);
for (var i = 0; i < keys.length; i++) {
   tests[keys[i]]();
}

})();
