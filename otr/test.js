'use strict';

var ws = {
   _buffer: [],
   send: function (string) {
      this._buffer.push(string);
   },
   receive: function () {
      var tmp = this._buffer[0];
      this._buffer = this._buffer.slice(1, this._buffer.length);
      return tmp;
   }
};

QUnit.test('ws spoof', function (assert) {
   ws.send('test');
   assert.equal(ws.receive(), 'test', 'Pass');
   ws.send('test1');
   ws.send('test2');
   ws.send('test');
   assert.equal(ws.receive(), 'test1', 'Pass');
   assert.equal(ws.receive(), 'test2', 'Pass');
   assert.equal(ws.receive(), 'test', 'Pass');
});

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
   var networkIn = {};
   var networkOut = {};
   
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
      return otr.ake1(alice, networkIn, networkOut)
   })
   .then(function () {
      networkIn = networkOut;
      networkOut = {};
      return otr.ake2(bob, networkIn, networkOut);
   })
   .then(function () {
      networkIn = networkOut;
      networkOut = {};
      return otr.ake3(alice, networkIn, networkOut);
   })
   .then(function () {
      networkIn = networkOut;
      networkOut = {};
      return otr.ake4(bob, networkIn, networkOut); 
   })
   .then(function () {
      networkIn = networkOut;
      networkOut = {};
      return otr.ake5(alice, networkIn, networkOut);
   })
   .then(function () {
      networkIn = networkOut;
      networkOut = {};
      alice.text = 'this is a message';
      return otr.ed1(alice, networkIn, networkOut);
   })
   .then(function () {
      networkIn = networkOut;
      networkOut = {};
      return otr.ed2(bob, networkIn, networkOut);
   })
   .then(function (result) {
      assert.strictEqual(bob.text, alice.text, 'Pass');
      bob.text = 'this is a response';
      networkIn = networkOut;
      networkOut = {};
      return otr.ed1(bob, networkIn, networkOut);
   })
   .then(function () {
      networkIn = networkOut;
      networkOut = {};
      return otr.ed2(alice, networkIn, networkOut);
   })
   .then(function (result) {
      assert.strictEqual(bob.text, alice.text, 'Pass');
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
         text: 'test message'   
      });
   }).then(function (result) {
      ws.send(JSON.stringify(result)); // spoof the send
      var message = JSON.parse(ws.receive());
      assert.equal(message.otr.type, 'query', 'Pass');
      return bob.convo.receive(ws, '', contacts, 'Bob', bob.longKey, message);
   }).then(function (result) {
      var message = JSON.parse(ws.receive());
      assert.equal(message.otr.type, 'ake1', 'Pass');
      return alice.convo.receive(ws, '', contacts, 'Alice', alice.longKey, message);
   }).then(function (result) {
      var message = JSON.parse(ws.receive());
      assert.equal(message.otr.type, 'ake2', 'Pass');
      return bob.convo.receive(ws, '', contacts, 'Bob', bob.longKey, message);
   }).then(function (result) {
      var message = JSON.parse(ws.receive());
      assert.equal(message.otr.type, 'ake3', 'Pass');
      return alice.convo.receive(ws, '', contacts, 'Alice', alice.longKey, message);
   }).then(function (result) {
      var message = JSON.parse(ws.receive());
      assert.equal(message.otr.type, 'ake4', 'Pass');
      return bob.convo.receive(ws, '', contacts, 'Bob', bob.longKey, message);
   }).then(function (result) {
      var message = JSON.parse(ws.receive());
      assert.equal(message.otr.type, 'ed1', 'Pass');
      return bob.convo.receive(ws, '', contacts, 'Bob', bob.longKey, message);
   }).then(function (result) {
      assert.equal(result.text, 'test message', 'Pass');
      done();     
   });

















/*.then(function (result) {
      ws.send(JSON.stringify(result));
      var message = JSON.parse(ws.receive());
      console.log(message);
      assert.equal(message.otr.type, 'query', 'Pass');
      assert.equal(message.text, undefined, 'Pass');
      return bob.convo.receive(ws, '', contacts, 'Bob', bob.longKey, message);
   }).then(function (result) {
      var message = result;
      assert.equal(message.otr.type, 'ake1', 'Pass');
      assert.notEqual(message.otr.hashGx, undefined, 'Pass');
      assert.notEqual(message.otr.aesGx, undefined, 'Pass');
      return alice.convo.receive(ws, '', contacts, 'Alice', alice.longKey, message);
   }).then(function (result) {
      done();
   });.then(function (result) {
      var message = result;
      assert.equal(message.otr.type, 'ake2', 'Pass');
      assert.notEqual(message.otr.gy, undefined, 'Pass');
      return bob.convo.receive(ws, '', contacts, 'Bob', bob.longKey, message);
   }).then(function (result) {
      var message = result;
      assert.equal(message.otr.type, 'ake3', 'Pass');
      done();
      return alice.convo.receive(ws, '', contacts, 'Alice', bob.longKey, message);
   });.then(function (result) {
      var message = result;
      assert.equal(message.otr.type, 'ake4', 'Pass');
      return bob.convo.receive(ws, '', contacts, 'Bob', bob.longKey, message);
   }).then(function (result) {
      var message = result;
      return alice.convo.send(ws, '', contacts, 'Alice', alice.longKey, message);
   }).then(function (result) {
      var message = result;
      assert.equal(message.otr.type, 'ed1', 'Pass');
      return bob.convo.receive(ws, '', contacts, 'Bob', bob.longKey, message);
   }).then(function (result) {
      var message = result;
      assert.equal(message.text, 'test', 'Pass');
      done();
   });*/
});
