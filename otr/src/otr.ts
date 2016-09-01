'use strict';

namespace otr {

   // TODO give better types
   class conversation {

      private ourLongKey: any;
      private ourKeys: any;
      private ourKeyId: number;
      private theirLongKey: any;
      private theirKeys: any;
      private theirKeyId: number;

      public constructor (ourLongKey, theirLongKey) {
         this.ourLongKey = ourLongKey;
         this.ourKeys = {};
         this.ourKeyId = 2;
         this.theirLongKey = theirLongKey;
         this.theirKeys = {};
      }

      public send () {

      }

      public recieve () {

      }

   }
  
   const h2 = async function (b, secbytes) {
      const result = new Uint8Array(1 + secbytes.length);
      result.set([b], 0); 
      result.set(secbytes, 1); 
      return await jwcl.hash.sha256(jwcl.utils.btos(result))
   };

   const akek = async function (s) {
      let keys: any = {};
      const lens = new Uint8Array(4);
      lens.set([0, 0, 0, s.length]);
      const secbytes = new Uint8Array(4 + s.length); 
      secbytes.set(lens, 0); 
      secbytes.set(s, 4);
      keys.ssid = jwcl.utils.btob64(jwcl.utils.b64tob(await h2(0, secbytes)).slice(0,8)); 
      const tmp = await h2(1, secbytes);
      keys.c =  jwcl.utils.btob64(jwcl.utils.b64tob(tmp).slice(0,16)); 
      keys.cprime =  jwcl.utils.btob64(jwcl.utils.b64tob(tmp).slice(16,32)); 
      keys.m1 = await h2(2, secbytes); 
      keys.m2 = await h2(3, secbytes); 
      keys.m1prime = await h2(4, secbytes); 
      keys.m2prime = await h2(5, secbytes);
      return keys;
   };

   const h1 = async function (b, secbytes) {
      const result = new Uint8Array(1 + secbytes.length);
      result.set([b], 0); 
      result.set(secbytes, 1); 
      return await jwcl.hash.sha1(jwcl.utils.btos(result));
   };

   const edk = async function (dh, pdh) {
      let keys: any = {};
      const ecdh = new jwcl.ecc.ecdh(dh);
      const key = await ecdh.derive(pdh);
      const s = jwcl.utils.b64tob(key);
      const lens = new Uint8Array(4);
      lens.set([0, 0, 0, s.length]);
      const secbytes = new Uint8Array(4 + s.length); 
      secbytes.set(lens, 0); 
      secbytes.set(s, 4);
      let sendbyte: number, recvbyte: number;
      if (dh.publicKey > pdh) {
         sendbyte = 1;
         recvbyte = 2;
      } else {
         sendbyte = 2;
         recvbyte = 1;
      }
      keys.sendAesKey = jwcl.utils.btob64(jwcl.utils.b64tob(await h1(sendbyte, secbytes)).slice(0,16));
      keys.recvAesKey = jwcl.utils.btob64(jwcl.utils.b64tob(await h1(recvbyte, secbytes)).slice(0,16));
      keys.sendMacKey = await jwcl.hash.sha1(keys.sendAesKey);
      keys.recvMacKey = await jwcl.hash.sha1(keys.recvAesKey);
      return keys;
   };

   export const ake1 = async function(local, network) {
      const r = jwcl.random(16);
      const gx   = await jwcl.ecc.ecdh.generate();
      local.ourKeys[local.ourKeyId - 1] = gx;
      local.ourKeys[local.ourKeyId] = await jwcl.ecc.ecdh.generate();
      const aes  = new jwcl.cipher.aes(r);
      const aesGx = await aes.encrypt(gx.publicKey);
      const hashGx = await jwcl.hash.sha256(gx.publicKey);
      local.r = r;
      local.gx = gx;
      network.aesGx = aesGx;
      network.hashGx = hashGx;
   };
 
   export const ake2 = async function (local, network) {
      const gy = await jwcl.ecc.ecdh.generate();
      local.ourKeys[local.ourKeyId - 1] = gy;
      local.ourKeys[local.ourKeyId] = await jwcl.ecc.ecdh.generate();
      local.gy = gy;
      local.ourKey = gy;
      local.aesGx = network.aesGx;
      local.hashGx = network.hashGx;
      network.gy = gy.publicKey;
   };
  
   export const ake3 = async function (local, network) {
      const gy = network.gy;
      const ecdh = new jwcl.ecc.ecdh(local.gx);
      const s = await ecdh.derive(gy);
      const keys = await akek(s);
      const keyId = local.ourKeyId - 1;
      const hmac1 = new jwcl.hash.hmac(keys.m1);
      const mB = await hmac1.sign(JSON.stringify({
         gx: local.gx.publicKey, 
         gy: gy, 
         pubB: local.ourLongKey.publicKey, 
         keyIdB: keyId   
      }));
      const ecdsa = new jwcl.ecc.ecdsa(local.ourLongKey);
      const xB = JSON.stringify({
         pubB: local.ourLongKey.publicKey,
         keyIdB: keyId,
         sigMb: await ecdsa.sign(mB)
      }); 
      const aes = new jwcl.cipher.aes(keys.c);
      const aesXb = await aes.encrypt(xB);
      const hmac2 = new jwcl.hash.hmac(keys.m2);
      const macAesXb = await hmac2.sign(aesXb);
      local.keys = keys;
      local.gy = gy;
      network.r = local.r;
      network.aesXb = aesXb;
      network.macAesXb = macAesXb;
   };
 
   export const ake4 = async function (local, network) {
      const r = network.r;
      const aesr = new jwcl.cipher.aes(r);
      const gx = await aesr.decrypt(local.aesGx);
      const hashGx = await jwcl.hash.sha256(gx);
      if (hashGx !== local.hashGx) {
         throw 'Error ake4: hashes do not match';
      }
      const ecdh = new jwcl.ecc.ecdh(local.gy);
      const s = await ecdh.derive(gx);
      const keys = await akek(s);
      const hmac2 = new jwcl.hash.hmac(keys.m2);
      const verifyMacM2 = await hmac2.verify(network.macAesXb, network.aesXb);
      if (verifyMacM2 !== true) {
         throw 'Error ake4: mac does not verify';
      }
      const aesc = new jwcl.cipher.aes(keys.c);
      const xB = JSON.parse(await aesc.decrypt(network.aesXb));
      const hmac1 = new jwcl.hash.hmac(keys.m1);
      const mB = await hmac1.sign(JSON.stringify({
         gx: gx, 
         gy: local.gy.publicKey, 
         pubB: local.theirLongKey, 
         keyIdB: xB.keyIdB   
      }));
      const key = {publicKey: local.theirLongKey, privateKey: ''};
      const ecdsab = new jwcl.ecc.ecdsa(key);
      const verifySigMb = await ecdsab.verify(xB.sigMb, mB);
      if (verifySigMb !== true) {
         throw 'Error ake4: signature does not verify';
      }
      const keyId = local.ourKeyId - 1;
      const hmac1p = new jwcl.hash.hmac(keys.m1prime);
      const mA = await hmac1p.sign(JSON.stringify({
         gy: local.gy.publicKey,
         gx: gx,
         pubA: local.ourLongKey.publicKey,
         keyIdA: keyId
      }));
      const ecdsaa = new jwcl.ecc.ecdsa(local.ourLongKey);
      const xA = JSON.stringify({
         pubA: local.ourLongKey.publicKey,
         keyIdA: keyId,
         sigMa: await ecdsaa.sign(mA)
      });
      const aescp = new jwcl.cipher.aes(keys.cprime);
      const aesXa = await aescp.encrypt(xA);
      const hmac2p = new jwcl.hash.hmac(keys.m2prime);
      const macAesXa = await hmac2p.sign(aesXa);
      local.keys = keys;
      local.gx = gx;
      local.theirKeyId = xB.keyIdB;
      local.theirKeys[local.theirKeyId] = local.gx;
      network.aesXa = aesXa;
      network.macAesXa = macAesXa;
   };
   
   export const ake5 = async function (local, network) {
      const hmac2p = new jwcl.hash.hmac(local.keys.m2prime);
      const verifyMacM2p = await hmac2p.verify(network.macAesXa, network.aesXa); 
      if (verifyMacM2p !== true) {
         throw 'Error ake5: mac does not verify';
      }
      const aescp = new jwcl.cipher.aes(local.keys.cprime);
      const xA = JSON.parse(await aescp.decrypt(network.aesXa));
      const hmac1p = new jwcl.hash.hmac(local.keys.m1prime);
      const mA = await hmac1p.sign(JSON.stringify({
         gy: local.gy,
         gx: local.gx.publicKey,
         pubA: local.theirLongKey,
         keyIdA: xA.keyIdA
      }));
      const key = {publicKey: local.theirLongKey, privateKey: ''};
      const ecdsaa = new jwcl.ecc.ecdsa(key);
      const verifySigMa = await ecdsaa.verify(xA.sigMa, mA);
      if (verifySigMa !== true) {
         throw 'Error ake5: signature does not verify';
      }
      local.theirKeyId = xA.keyIdA;
      local.theirKeys[local.theirKeyId] = local.gy;
   }

   export const ed1 = async function (local, network) {

      const sendKey = local.ourKeys[local.ourKeyId - 1];
      const recvKey = local.theirKeys[local.theirKeyId];
      const sendKeyId = local.ourKeyId - 1; 
      const recvKeyId = local.theirKeyId; 
      const nextDh = local.ourKeys[local.ourKeyId].publicKey;
      const message = local.message;

      const keys = await edk(sendKey, recvKey)
      const aes = new jwcl.cipher.aes(keys.sendAesKey);         
      const ciphertext = await aes.encrypt(message);

      const ta = JSON.stringify({
         sendKeyId: sendKeyId,
         recvKeyId: recvKeyId,
         nextDh: nextDh,
         aesMessage: ciphertext
      });
      
      const hmac = new jwcl.hash.hmac(keys.sendMacKey);
      const macTa = await hmac.sign(ta);

      network.ta = ta;
      network.macTa = macTa;
   }

   export const ed2 = async function (local, network) {
      
      const ta = JSON.parse(network.ta);
      const macTa = network.macTa;
      const sendKeyId = ta.sendKeyId; 
      const recvKeyId = ta.recvKeyId; 
      const sendKey = local.ourKeys[recvKeyId]; // TODO write about this as it is kinda weird
      const recvKey = local.theirKeys[sendKeyId];

      if (recvKeyId === local.ourKeyId) {
         delete local.ourKeys[local.ourKeyId - 1];
         local.ourKeyId++;
         local.ourKeys[local.ourKeyId] = await jwcl.ecc.ecdh.generate();
      }
      if (sendKeyId === local.theirKeyId) {
         local.theirKeyId++;
         local.theirKeys[local.theirKeyId] = ta.nextDh;
      }

      const keys = await edk(sendKey, recvKey);
      const hmac = new jwcl.hash.hmac(keys.recvMacKey);
      const verify = await hmac.verify(macTa, network.ta); 
      if (verify === false) {
         throw "ERROR ed2: mac does not verify";
      }
      const aes = new jwcl.cipher.aes(keys.recvAesKey);
      const plaintext = await aes.decrypt(ta.aesMessage);
      local.message = plaintext;
   }

   export namespace test {

      const test = function(name: string, result: any, expected: any) {
         const p = document.createElement('p');
         if (expected !== result) {
            p.innerText =
               name + ' ... fail\n' +
               '   result: ' + result + '\n' +
               '   expected: ' + expected;
         } else {
            p.innerText = name + ' ... pass';
         }
         document.body.appendChild(p);
      };

      const testno = function(name: string, result: any, notexpected: any) {
         const p = document.createElement('p');
         if (notexpected === result) {
            p.innerText = 
               name + '... fail\n' +
               '   result: ' + result + '\n' +
               '   notexpected: ' + notexpected;
         } else {
            p.innerText = name + '... pass';
         }
         document.body.appendChild(p);
      };

      const testAll = async function () {

         let alice: any = {};
         let bob: any = {};
         let network: any = {};
          
         alice.ourLongKey = await jwcl.ecc.ecdsa.generate();
         bob.ourLongKey = await jwcl.ecc.ecdsa.generate();
         alice.theirLongKey = bob.ourLongKey.publicKey;
         bob.theirLongKey = alice.ourLongKey.publicKey;
 
         alice.ourKeys = {};
         alice.ourKeyId = 2; 
         alice.theirKeys = {}; 
         bob.ourKeys = {}; 
         bob.ourKeyId = 2;
         bob.theirKeys = {};

         await ake1(bob, network);
         await ake2(alice, network);
         await ake3(bob, network);
         await ake4(alice, network); 
         await ake5(bob, network);

         alice.message = 'this is a message';
         await ed1(alice, network);
         await ed2(bob, network);
         test('alice send', bob.message, alice.message);

         alice.message = 'this is two messages in a row';
         await ed1(alice, network);
         await ed2(bob, network);
         test('alice send two', bob.message, alice.message);

         bob.message = 'this is a response';
         await ed1(bob, network);
         await ed2(alice, network);
         test('bob response', bob.message, alice.message);

         for (let i = 0; i < 100; i++) {
            alice.message = 'this is a message ' + i;
            await ed1(alice, network);
            await ed2(bob, network);
            test('alice send normal ' + i, bob.message, alice.message);

            bob.message = 'this is a response ' + i;
            await ed1(bob, network);
            await ed2(alice, network);
            test('bob response normal ' + i, bob.message, alice.message);
         }

         for (let i = 0; i < 100; i++) {
            alice.message = 'this is a message ' + i;
            await ed1(alice, network);
            await ed2(bob, network);
            test('alice send in a row ' + i, bob.message, alice.message);
         }

         for (let i = 0; i < 100; i++) {
            bob.message = 'this is a response ' + i;
            await ed1(bob, network);
            await ed2(alice, network);
            test('bob response in a row ' + i, bob.message, alice.message);
         }

      };

      export const run = async function() {
         await testAll();
      };
   }

}
