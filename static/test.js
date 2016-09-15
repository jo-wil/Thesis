'use strict';



QUnit.test('jwcl exists', function(assert) {
  assert.ok(jwcl, 'jwcl');
});

QUnit.test('jwcl api', function (assert) {
   var done = assert.async();

   var key = jwcl.random(16);
   var hmac = new jwcl.hash.hmac(key);

   assert.equal(key.length, Math.ceil(16/ 3) * 4, 'random length'); 
   assert.equal(typeof key, 'string', 'random type'); 

   Promise.all([
      jwcl.hash.sha1('abc'),
      jwcl.hash.sha256('abc')
   ])
   .then(function (results) {
      assert.equal(results[0], 'qZk+NkcGgWq6PiVxeFDCbJzQ2J0=', 'jwcl.hash.sha1 "abc"')
      assert.equal(results[1], 'ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=', 'jwcl.hash.sha256 "abc"')
      return hmac.sign('important message')
   })
   .then(function (result) {
      return Promise.all([
         hmac.verify(result, 'important message'),
         hmac.verify(result, 'important message changed')
      ]) 
   })
   .then(function (results) {
      assert.ok(results[0], 'jwcl.hash.hmac verify');
      assert.notOk(results[1], 'jwcl.hash.hmac not verify');
      done();
   });

});

QUnit.test('otr exists', function(assert) {
   assert.ok(otr, 'otr');
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
      assert.strictEqual(bob.text, alice.text, 'otr message');
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
      assert.strictEqual(bob.text, alice.text, 'otr response');
      done();
   });
});

QUnit.test('otr api', function(assert) {
   var done = assert.async();

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
      assert.equal(message.from, 'Alice', 'query from');
      assert.equal(message.to, 'Bob', 'query to');
      assert.equal(message.otr.type, 'query', 'query type');
      return bob.convo.receive(ws, '', contacts, 'Bob', bob.longKey, message);
   }).then(function (result) {
      var message = JSON.parse(ws.receive());
      assert.equal(message.from, 'Bob', 'ake1 from');
      assert.equal(message.to, 'Alice', 'ake1 to');
      assert.equal(message.otr.type, 'ake1', 'ake1');
      return alice.convo.receive(ws, '', contacts, 'Alice', alice.longKey, message);
   }).then(function (result) {
      var message = JSON.parse(ws.receive());
      assert.equal(message.from, 'Alice', 'ake2 from');
      assert.equal(message.to, 'Bob', 'ake2 to');
      assert.equal(message.otr.type, 'ake2', 'ake2');
      return bob.convo.receive(ws, '', contacts, 'Bob', bob.longKey, message);
   }).then(function (result) {
      var message = JSON.parse(ws.receive());
      assert.equal(message.from, 'Bob', 'ake3 from');
      assert.equal(message.to, 'Alice', 'ake3 to');
      assert.equal(message.otr.type, 'ake3', 'ake3');
      return alice.convo.receive(ws, '', contacts, 'Alice', alice.longKey, message);
   }).then(function (result) {
      var message = JSON.parse(ws.receive());
      assert.equal(message.from, 'Alice', 'ake4 from');
      assert.equal(message.to, 'Bob', 'ake4 to');
      assert.equal(message.otr.type, 'ake4', 'ake4');
      return bob.convo.receive(ws, '', contacts, 'Bob', bob.longKey, message);
   }).then(function (result) {
      var message = JSON.parse(ws.receive());
      assert.equal(message.from, 'Alice', 'ed1 from');
      assert.equal(message.to, 'Bob', 'ed1 to');
      assert.equal(message.otr.type, 'ed1', 'ed1');
      return bob.convo.receive(ws, '', contacts, 'Bob', bob.longKey, message);
   }).then(function (result) {
      var message = result;
      assert.equal(message.from, 'Alice', 'ed2 from');
      assert.equal(message.to, 'Bob', 'ed2 to');
      assert.equal(message.text, 'test message', 'message');
      done();     
   });
});
