'use strict';

QUnit.test('jwcl api', function (assert) {

   var done = assert.async();

   var key = jwcl.random(16);
   var hmac = new jwcl.hash.hmac(key);
   var aes = new jwcl.cipher.aes(key);
   var ecc, ecdsa;

   assert.ok(jwcl, 'jwcl exists');
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
      return Promise.all([
         aes.encrypt('secret message'),     
         aes.encrypt('secret message')     
      ]);
   })
   .then(function (results) {
      assert.notEqual(results[0], results[1], 'jwcl.cipher.aes not equal');
      return aes.decrypt(results[0])
   })
   .then(function (result) {
      assert.equal(result, 'secret message', 'jwcl.cipher.aes decrypt');
      return Promise.all([
         jwcl.ecc.ecdh.generate(),
         jwcl.ecc.ecdh.generate(),
         jwcl.ecc.ecdsa.generate()
      ]); 
   })
   .then(function (results) {
      var publicKey = results[1].publicKey;
      ecc = new jwcl.ecc.ecdh(results[0]);
      ecdsa = new jwcl.ecc.ecdsa(results[2]);
      return Promise.all([
         ecc.derive(publicKey),
         ecdsa.sign('important message')
      ]);
   })
   .then(function (results) {
      assert.equal(results[0].length, Math.ceil(16/ 3) * 4, 'jwcl.ecc.ecdh length');
      assert.equal(typeof results[0], 'string', 'jwcl.ecc.ecdh type');
      return Promise.all([
         ecdsa.verify(results[1], 'important message'),
         ecdsa.verify(results[1], 'important message changed')
      ]);      
   })
   .then(function (results) {
      assert.ok(results[0], 'jwcl.ecc.ecdsa verify');
      assert.notOk(results[1], 'jwcl.ecc.ecdsa not verify');
      done();
   }); 


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
 
   assert.ok(otr, 'otr exists');
   
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

   assert.ok(otr, 'otr exists');
   
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
         action: 'message',
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

QUnit.test('app implementation', function (assert) {
   assert.ok(app, 'app exists');
   assert.ok(app.globals, 'app.globals exists');
   assert.ok(app.chat, 'app.chat exists ');
   assert.ok(app.login, 'app.login exists');
});

QUnit.test('app api', function (assert) {
   
   var done = assert.async();
   
   Promise.all([
      fetch('/api/signup', {
         method: 'POST',
         body: JSON.stringify({
            username: 'Alice',
            password: '1234'
         })
      }),
      fetch('/api/signup', {
         method: 'POST',
         body: JSON.stringify({
            username: 'Bob',
            password: 'abc'
         })
      }),
      fetch('/api/signup', {
         method: 'POST',
         body: JSON.stringify({
            username: 'Charlie',
            password: '0000'
         })
      })
   ])
   .then(function (results) {
      assert.notEqual(results[0].status, 500, '/api/signup Alice');
      assert.notEqual(results[1].status, 500, '/api/signup Bob');
      assert.notEqual(results[2].status, 500, '/api/signup Charlie');
      return Promise.all([
         fetch('/api/login', {
            method: 'POST',
            body: JSON.stringify({
               username: 'Alice',
               password: '1234'
            })
         }),
         fetch('/api/login', {
            method: 'POST',
            body: JSON.stringify({
               username: 'Bob',
               password: 'abc'
            })
         })
      ])   
   })
   .then(function (results) {
      assert.equal(results[0].status, 200, '/api/login Alice');
      assert.equal(results[1].status, 200, '/api/login Bob');
      done();
   })
});
