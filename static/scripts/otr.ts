'use strict';

namespace otr {

   const MSGSTATE_PLAINTEXT = 0;
   const MSGSTATE_ENCRYPTED = 1;
   const MSGSTATE_FINISHED = 2;
   const AUTHSTATE_NONE = 0;
   const AUTHSTATE_AWAITING_DHKEY = 1;
   const AUTHSTATE_AWAITING_REVEALSIG = 2;
   const AUTHSTATE_AWAITING_SIG = 3;

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

   export const ake1 = async function (local, networkIn, networkOut) {
      const r = jwcl.random(16);
      const gx   = await jwcl.ecc.ecdh.generate();
      local.ourKeys[local.ourKeyId - 1] = gx;
      local.ourKeys[local.ourKeyId] = await jwcl.ecc.ecdh.generate();
      const aes  = new jwcl.cipher.aes(r);
      const aesGx = await aes.encrypt(gx.publicKey);
      const hashGx = await jwcl.hash.sha256(gx.publicKey);
      local.r = r;
      local.gx = gx;
      networkOut.type = 'ake1';
      networkOut.aesGx = aesGx;
      networkOut.hashGx = hashGx;
   };
 
   export const ake2 = async function (local, networkIn, networkOut) {
      const gy = await jwcl.ecc.ecdh.generate();
      local.ourKeys[local.ourKeyId - 1] = gy;
      local.ourKeys[local.ourKeyId] = await jwcl.ecc.ecdh.generate();
      local.gy = gy;
      local.ourKey = gy;
      local.aesGx = networkIn.aesGx;
      local.hashGx = networkIn.hashGx;
      networkOut.type = 'ake2';
      networkOut.gy = gy.publicKey;
   };
  
   export const ake3 = async function (local, networkIn, networkOut) {
      const gy = networkIn.gy;
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
      networkOut.type = 'ake3';
      networkOut.r = local.r;
      networkOut.aesXb = aesXb;
      networkOut.macAesXb = macAesXb;
   };
 
   export const ake4 = async function (local, networkIn, networkOut) {
      const r = networkIn.r;
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
      const verifyMacM2 = await hmac2.verify(networkIn.macAesXb, networkIn.aesXb);
      if (verifyMacM2 !== true) {
         throw 'Error ake4: mac does not verify';
      }
      const aesc = new jwcl.cipher.aes(keys.c);
      const xB = JSON.parse(await aesc.decrypt(networkIn.aesXb));
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
      networkOut.type = 'ake4';
      networkOut.aesXa = aesXa;
      networkOut.macAesXa = macAesXa;
   };
   
   export const ake5 = async function (local, networkIn, networkOut) {
      const hmac2p = new jwcl.hash.hmac(local.keys.m2prime);
      const verifyMacM2p = await hmac2p.verify(networkIn.macAesXa, networkIn.aesXa); 
      if (verifyMacM2p !== true) {
         throw 'Error ake5: mac does not verify';
      }
      const aescp = new jwcl.cipher.aes(local.keys.cprime);
      const xA = JSON.parse(await aescp.decrypt(networkIn.aesXa));
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

   export const ed1 = async function (local, networkIn, networkOut) {
      const sendKey = local.ourKeys[local.ourKeyId - 1];
      const recvKey = local.theirKeys[local.theirKeyId];
      const sendKeyId = local.ourKeyId - 1; 
      const recvKeyId = local.theirKeyId; 
      const nextDh = local.ourKeys[local.ourKeyId].publicKey;
      const plaintext = local.text;
      const keys = await edk(sendKey, recvKey)
      if (!local.sendAes) {
         local.sendAes = new jwcl.cipher.aes(keys.sendAesKey);
      }
      const aes = local.sendAes;
      const ciphertext = await aes.encrypt(plaintext);
      const ta = JSON.stringify({
         sendKeyId: sendKeyId,
         recvKeyId: recvKeyId,
         nextDh: nextDh,
         aesMessage: ciphertext
      });
      const hmac = new jwcl.hash.hmac(keys.sendMacKey);
      const macTa = await hmac.sign(ta);
      networkOut.type = 'ed1';
      networkOut.ta = ta;
      networkOut.macTa = macTa;
   }

   export const ed2 = async function (local, networkIn, networkOut) {
      
      const ta = JSON.parse(networkIn.ta);
      const macTa = networkIn.macTa;
      const sendKeyId = ta.sendKeyId; 
      const recvKeyId = ta.recvKeyId; 
      const sendKey = local.ourKeys[recvKeyId]; // TODO write about this as it is kinda weird
      const recvKey = local.theirKeys[sendKeyId];
      const keys = await edk(sendKey, recvKey);
      const hmac = new jwcl.hash.hmac(keys.recvMacKey);
      const verify = await hmac.verify(macTa, networkIn.ta); 
      if (verify === false) {
         throw "ERROR ed2: mac does not verify";
      }
      if (!local.recvAes) {
         local.recvAes = new jwcl.cipher.aes(keys.recvAesKey);
      }
      const aes = local.recvAes;
      const plaintext = await aes.decrypt(ta.aesMessage);
      local.text = plaintext;

      if (recvKeyId === local.ourKeyId) {
         delete local.sendAes;
         delete local.recvAes;
         delete local.ourKeys[local.ourKeyId - 1];
         local.ourKeyId++;
         local.ourKeys[local.ourKeyId] = await jwcl.ecc.ecdh.generate();
      }
      if (sendKeyId === local.theirKeyId) {
         delete local.sendAes;
         delete local.recvAes;
         local.theirKeyId++;
         local.theirKeys[local.theirKeyId] = ta.nextDh;
      }
   }

   export class Otr {

      private _convos: any;

      public constructor() {
         this._convos = {};
      }

      public async send (ws, token, contacts, username, longKey, message) {
         
         let contact;
         let otr = {};
         
         for (let i = 0; i < contacts.length; i++) {
            if (contacts[i].username === message.to) {
               contact = contacts[i];
               break;
            }       
         }

         if (message.to in this._convos) {
            if (message.text) {
               this._convos[message.to].text = message.text;
            }
            await ed1(this._convos[message.to], {}, otr); 
         } else {
            this._convos[message.to] = {
               authState: MSGSTATE_PLAINTEXT,
               msgState: AUTHSTATE_NONE,
               text: message.text,
               ourLongKey: longKey,
               ourKeys: {},
               ourKeyId: 2,
               theirLongKey: contact.publicKey,
               theirKeys: {},
               theirKeyId: -1,
            };
            otr = {
               type: 'query'
            }; 
         }
         message = {
            action: message.action,
            token: token,
            from: username,
            to: message.to,
            otr: otr
         };
         console.log('SENDING', message);
         return message;
      }
      
      public async receive (ws, token, contacts, username, longKey, message) {
         
         console.log('RECEIVING', message);
         let contact;
         let otr = {};
         
         for (let i = 0; i < contacts.length; i++) {
            if (contacts[i].username === message.from) {
               contact = contacts[i];
               break;
            }       
         }
 
         if (message.from in this._convos) {
            if (message.otr.type === 'ake1') {
               await ake2(this._convos[message.from], message.otr, otr);
               ws.send(JSON.stringify({
                  action: message.action,
                  token: token,
                  from: username,
                  to: message.from,
                  otr: otr
               }));
            } else if (message.otr.type === 'ake2') {
               await ake3(this._convos[message.from], message.otr, otr);
               ws.send(JSON.stringify({
                  action: message.action,
                  token: token,
                  from: username,
                  to: message.from,
                  otr: otr
               }));
            } else if (message.otr.type === 'ake3') {
               await ake4(this._convos[message.from], message.otr, otr);
               ws.send(JSON.stringify({
                  action: message.action,
                  token: token,
                  from: username,
                  to: message.from,
                  otr: otr
               }));
               if (this._convos[message.from].text) {
                  otr = {};
                  await ed1(this._convos[message.from], message.otr, otr);
                  ws.send(JSON.stringify({
                     action: message.action,
                     token: token,
                     from: username,
                     to: message.from,
                     otr: otr
                  }));
               }
            } else if (message.otr.type === 'ake4') {
               await ake5(this._convos[message.from], message.otr, {});
               if (this._convos[message.from].text) {
                  await ed1(this._convos[message.from], message.otr, otr);
                  ws.send(JSON.stringify({
                     action: message.action,
                     token: token,
                     from: username,
                     to: message.from,
                     otr: otr
                  }));
               }
            } else if (message.otr.type === 'ed1') {
               await ed2(this._convos[message.from], message.otr, otr);
               message.text = this._convos[message.from].text;
            }
         } else {
            if (message.otr.type === 'query') {
               this._convos[message.from] = {
                  authState: MSGSTATE_PLAINTEXT,
                  msgState: AUTHSTATE_NONE,
                  ourLongKey: longKey,
                  ourKeys: {},
                  ourKeyId: 2,
                  theirLongKey: contact.publicKey,
                  theirKeys: {},
                  theirKeyId: -1
               };
               await ake1(this._convos[message.from], message.otr, otr);
               ws.send(JSON.stringify({
                  action: message.action,
                  token: token,
                  from: username,
                  to: message.from,
                  otr: otr
               }));               
            }
         }
         return message;
      }
   }
}
