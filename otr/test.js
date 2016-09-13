'use strict';

var ws = {
   buffer: '',
   send: function (string) {
      this.buffer = string;
   }
};

QUnit.test('otr exists', function(assert) {
   assert.ok(otr, 'Pass');
});

QUnit.test('jwcl exists', function(assert) {
  assert.ok(jwcl, 'Pass');
});

QUnit.test('otr implementation', function(assert) {
   var done = assert.async();

   var alice = {};
   var bob = {};
   var network = {};
   
   alice.ourKeys = {};
   alice.ourKeyId = 2; 
   alice.theirKeys = {}; 
   bob.ourKeys = {}; 
   bob.ourKeyId = 2;
   bob.theirKeys = {};
 
   Promise.all([
      jwcl.ecc.ecdsa.generate(),
      jwcl.ecc.ecdsa.generate()
   ]) 
   .then(function (results) {
      alice.ourLongKey = results[0];
      bob.ourLongKey = results[1];
      alice.theirLongKey = bob.ourLongKey.publicKey;
      bob.theirLongKey = alice.ourLongKey.publicKey;
      return;
   })
   .then(function () {
      return otr.ake1(alice, network)
   })
   .then(function () {
      return otr.ake2(bob, network);
   })
   .then(function () {
      return otr.ake3(alice, network);
   })
   .then(function () {
      return otr.ake4(bob, network); 
   })
   .then(function () {
      return otr.ake5(alice, network);
   })
   .then(function () {
      alice.message = 'this is a message';
      return otr.ed1(alice, network);
   })
   .then(function () {
      return otr.ed2(bob, network);
   })
   .then(function (result) {
      assert.strictEqual(result, alice.message, 'Pass');
      bob.message = 'this is a response';
      return otr.ed1(bob, network);
   })
   .then(function () {
      return otr.ed2(alice, network);
   })
   .then(function (result) {
      assert.strictEqual(bob.message, result, 'Pass');
      done();
   });
});

QUnit.test('otr api', function(assert) {
   var done = assert.async();

   var alice, bob, contacts;

   Promise.all([
      jwcl.ecc.ecdsa.generate(),
      jwcl.ecc.ecdsa.generate()
   ])
   .then(function (results) {
      alice = {
         longKey: results[0],
         convo: new otr.Otr()
      };
      bob = {
         longKey: results[1], 
         convo: new otr.Otr()
      };
      contacts = [{
         username: 'Alice',
         publicKey: alice.longKey.publicKey   
      }, {
         username: 'Bob',
         publicKey: bob.longKey.publicKey   
      }]
      return alice.convo.send(ws, '', contacts, 'Alice', alice.longKey, {
         from: 'Alice',
         to: 'Bob',
         message: 'test'   
      });
   }).then(function (result) {
      var message = result;
      assert.equal(message.text, undefined, 'Pass');
      return bob.convo.recieve(ws, '', contacts, 'Bob', bob.longKey, message);
   }).then(function (result) {
      var message = result;
      assert.equal(message.text, 'TODO', 'Pass');
      done();
   });
});
