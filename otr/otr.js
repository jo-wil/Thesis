'use strict';

var otr = (function () {

var otr = {};

var ake1 = function (user, network) {
   var promise = new Promise(function (resolve, reject) {
      // Picks a random value r (128 bits)
      var r = jc.random(16);
      // Picks a random value x (at least 320 bits)
      var gx;
      jc.ecdh.generate()
      .then(function (result) {
         gx = result;
         var ctr = jc.random(16);
         // Sends Alice AESr(gx), HASH(gx)
         return Promise.all([ 
            jc.aes.ctr.encrypt(r, ctr, gx.publicKey),
            jc.hash.sha256(gx.publicKey)
         ]);
      })
      .then(function (result) {
         user.r = r;
         user.gx = gx;
         network.aes_r_gx = result[0];
         network.hash_gx = result[1];
         resolve();
      });
   });
   return promise;
};

var ake2 = function (user, network) {
   var promise = new Promise(function (resolve, reject) {
      var gy;
      // Picks a random value y (at least 320 bits)
      jc.ecdh.generate()
      .then(function (result) {
         gy = result;
         user.gy = gy;
         network.gy = gy.publicKey;
         resolve();
      });
   });
   return promise;
};

var ake3 = function (user, network) {};
var ake4 = function (user, network) {};
var ake5 = function (user, network) {};


var h1 = function (b, secbytes) {
   var promise = new Promise(function (resolve, reject) {
      var result = new Uint8Array(1 + secbytes.length);
      result.set([b], 0); 
      result.set(secbytes, 1); 
      jc.hash.sha1(jc.utils.btos(result))
      .then(function (result) {
         resolve(result);
      });
   });
   return promise;
};

var edk = function (dh, pdh) {
   var promise = new Promise(function (resolve, reject) {
      var keys = {};
      jc.ecdh.derive(pdh, dh.privateKey)
      .then(function (result) {
         var s = jc.utils.b64tob(result);
         var lens = new Uint8Array(4);
         lens.set([0, 0, 0, s.length]);
         var secbytes = new Uint8Array(4 + s.length); 
         secbytes.set(lens, 0); 
         secbytes.set(s, 4);
         var sendbyte, recvbyte;
         if (dh.publicKey > pdh) {
            sendbyte = 1;
            recvbyte = 2;
         } else {
            sendbyte = 2;
            recvbyte = 1;
         }
         Promise.all([
            h1(sendbyte, secbytes),
            h1(recvbyte, secbytes)
         ])
         .then(function (result) {
            var sendAesKey = jc.utils.btob64(jc.utils.b64tob(result[0]).slice(0,16));
            var recvAesKey = jc.utils.btob64(jc.utils.b64tob(result[1]).slice(0,16));
            keys.sendAesKey = sendAesKey;
            keys.recvAesKey = recvAesKey;
            return Promise.all([
               jc.hash.sha1(sendAesKey),
               jc.hash.sha1(recvAesKey)
            ]);
         })
         .then(function (result) {
            var sendMacKey = result[0];
            var recvMacKey = result[1];
            keys.sendMacKey = sendMacKey;
            keys.recvMacKey = recvMacKey;
            resolve(keys);
         });   
      });
   });
   return promise;
};

var ed1 = function (msg, user, network) {
   var promise = new Promise(function (resolve, reject) {
      var keyA = user.dh;
      var keyIdA = 1;

      var keyB = user.pdh;    
      var keyIdB = 1;

      var keys;
      var ctr;
      var ta;
      
      edk(keyA, keyB)
      .then(function (result) {
         keys = result;
         ctr = jc.random(16);
         return jc.aes.ctr.encrypt(keys.sendAesKey, ctr, msg);
      })
      .then(function (result) {
         ta = JSON.stringify({
            keyIdA: keyIdA,
            keyIdB: keyIdB,
            next_dh: 'TODO',
            ctr: ctr,
            aes_msg: result
         });
         return jc.hmac.sign(keys.sendMacKey, ta);
      })
      .then(function (result) {
         user.keys = keys; 
         network.ta = ta;
         network.mac_ta = result;
         resolve();
      });
   });
   return promise;
};

var ed2 = function (user, network) {
   var promise = new Promise(function (resolve, reject) {
      var keyA = user.dh;
      var keyIdA = 1;

      var keyB = user.pdh;    
      var keyIdB = 1;

      var keys;
      var ta = network.ta;
      var mac_ta = network.mac_ta; 
      
      edk(keyA, keyB)
      .then(function (result) {
         keys = result;
         return jc.hmac.verify(keys.recvMacKey, ta, mac_ta); 
      })
      .then(function (result) {
         if (result === true) {
            ta = JSON.parse(ta);
            return jc.aes.ctr.decrypt(keys.recvAesKey, ta.aes_msg);
         } 
         throw "ERROR";
      })
      .then(function (result) {
         user.keys = keys; 
         resolve(result);
      });
   
   });
   return promise;
};

otr.ake1 = ake1;
otr.ake2 = ake2;
otr.ake3 = ake3;
otr.ake4 = ake4;
otr.ake5 = ake5;
otr.ed1 = ed1;
otr.ed2 = ed2;

return otr;

})();
