'use strict';

(function () {

var tests = {};

var results = {};

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

tests.genKey = function () {
   var key = jcrypt.random(16);
   test('genKeyLength', Math.ceil(16/ 3) * 4, key.length); 
   test('genKeyType', 'string', typeof key); 
};

tests.aes = function () {
   var key = jcrypt.random(16);
   var iv = jcrypt.random(jcrypt.aes.IV_LEN);
   jcrypt.aes.encrypt(key, iv, 'secret message')
   .then(function (result) {
      return jcrypt.aes.decrypt(key, result);
   })
   .then(function (result) {
      test('encryptDecrypt', result, 'secret message');
   });
};

tests.sha256 = function () {
   jcrypt.sha256.hash('abc')
   .then(function (result) {
      test('sha256"abc"', result, 'ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=')
   });
};
tests.ecdhGen = function () {
   jcrypt.ecdh.generate()
   .then(function (result) {
      var keys = Object.keys(result);
      test('ecdhGenPublic', keys[0], 'publicKey');
      test('ecdhGenPrivate', keys[1], 'privateKey');
   });
};

tests.ecdhDerive = function () {
   jcrypt.ecdh.generate()
   .then(function (result) {
      return jcrypt.ecdh.derive(result.publicKey, result.privateKey);
   })
   .then(function (result) {
      test('ecdhDeriveLength', Math.ceil(16/ 3) * 4, result.length); 
      test('ecdhDeriveType', 'string',  typeof result); 
   });
};

// Run tests
var keys = Object.keys(tests);
for (var i = 0; i < keys.length; i++) {
   tests[keys[i]]();
}

})();
