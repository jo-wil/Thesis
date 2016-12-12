'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var otr;
(function (otr_1) {
    const MSGSTATE_PLAINTEXT = 0;
    const MSGSTATE_ENCRYPTED = 1;
    const MSGSTATE_FINISHED = 2;
    const AUTHSTATE_NONE = 0;
    const AUTHSTATE_AWAITING_DHKEY = 1;
    const AUTHSTATE_AWAITING_REVEALSIG = 2;
    const AUTHSTATE_AWAITING_SIG = 3;
    const h2 = function (b, secbytes) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = new Uint8Array(1 + secbytes.length);
            result.set([b], 0);
            result.set(secbytes, 1);
            return yield jwcl.hash.sha256(jwcl.utils.btos(result));
        });
    };
    const akek = function (s) {
        return __awaiter(this, void 0, void 0, function* () {
            let keys = {};
            const lens = new Uint8Array(4);
            lens.set([0, 0, 0, s.length]);
            const secbytes = new Uint8Array(4 + s.length);
            secbytes.set(lens, 0);
            secbytes.set(s, 4);
            keys.ssid = jwcl.utils.btob64(jwcl.utils.b64tob(yield h2(0, secbytes)).slice(0, 8));
            const tmp = yield h2(1, secbytes);
            keys.c = jwcl.utils.btob64(jwcl.utils.b64tob(tmp).slice(0, 16));
            keys.cprime = jwcl.utils.btob64(jwcl.utils.b64tob(tmp).slice(16, 32));
            keys.m1 = yield h2(2, secbytes);
            keys.m2 = yield h2(3, secbytes);
            keys.m1prime = yield h2(4, secbytes);
            keys.m2prime = yield h2(5, secbytes);
            return keys;
        });
    };
    const h1 = function (b, secbytes) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = new Uint8Array(1 + secbytes.length);
            result.set([b], 0);
            result.set(secbytes, 1);
            return yield jwcl.hash.sha1(jwcl.utils.btos(result));
        });
    };
    const edk = function (dh, pdh) {
        return __awaiter(this, void 0, void 0, function* () {
            let keys = {};
            const ecdh = new jwcl.ecc.ecdh(dh);
            const key = yield ecdh.derive(pdh);
            const s = jwcl.utils.b64tob(key);
            const lens = new Uint8Array(4);
            lens.set([0, 0, 0, s.length]);
            const secbytes = new Uint8Array(4 + s.length);
            secbytes.set(lens, 0);
            secbytes.set(s, 4);
            let sendbyte, recvbyte;
            if (dh.publicKey > pdh) {
                sendbyte = 1;
                recvbyte = 2;
            }
            else {
                sendbyte = 2;
                recvbyte = 1;
            }
            keys.sendAesKey = jwcl.utils.btob64(jwcl.utils.b64tob(yield h1(sendbyte, secbytes)).slice(0, 16));
            keys.recvAesKey = jwcl.utils.btob64(jwcl.utils.b64tob(yield h1(recvbyte, secbytes)).slice(0, 16));
            keys.sendMacKey = yield jwcl.hash.sha1(keys.sendAesKey);
            keys.recvMacKey = yield jwcl.hash.sha1(keys.recvAesKey);
            return keys;
        });
    };
    otr_1.ake1 = function (local, networkIn, networkOut) {
        return __awaiter(this, void 0, void 0, function* () {
            const r = jwcl.random(16);
            const gx = yield jwcl.ecc.ecdh.generate();
            local.ourKeys[local.ourKeyId - 1] = gx;
            local.ourKeys[local.ourKeyId] = yield jwcl.ecc.ecdh.generate();
            const aes = new jwcl.cipher.aes(r);
            const aesGx = yield aes.encrypt(gx.publicKey);
            const hashGx = yield jwcl.hash.sha256(gx.publicKey);
            local.r = r;
            local.gx = gx;
            networkOut.type = 'ake1';
            networkOut.aesGx = aesGx;
            networkOut.hashGx = hashGx;
        });
    };
    otr_1.ake2 = function (local, networkIn, networkOut) {
        return __awaiter(this, void 0, void 0, function* () {
            const gy = yield jwcl.ecc.ecdh.generate();
            local.ourKeys[local.ourKeyId - 1] = gy;
            local.ourKeys[local.ourKeyId] = yield jwcl.ecc.ecdh.generate();
            local.gy = gy;
            local.ourKey = gy;
            local.aesGx = networkIn.aesGx;
            local.hashGx = networkIn.hashGx;
            networkOut.type = 'ake2';
            networkOut.gy = gy.publicKey;
        });
    };
    otr_1.ake3 = function (local, networkIn, networkOut) {
        return __awaiter(this, void 0, void 0, function* () {
            const gy = networkIn.gy;
            const ecdh = new jwcl.ecc.ecdh(local.gx);
            const s = yield ecdh.derive(gy);
            const keys = yield akek(s);
            const keyId = local.ourKeyId - 1;
            const hmac1 = new jwcl.hash.hmac(keys.m1);
            const mB = yield hmac1.sign(JSON.stringify({
                gx: local.gx.publicKey,
                gy: gy,
                pubB: local.ourLongKey.publicKey,
                keyIdB: keyId
            }));
            const ecdsa = new jwcl.ecc.ecdsa(local.ourLongKey);
            const xB = JSON.stringify({
                pubB: local.ourLongKey.publicKey,
                keyIdB: keyId,
                sigMb: yield ecdsa.sign(mB)
            });
            const aes = new jwcl.cipher.aes(keys.c);
            const aesXb = yield aes.encrypt(xB);
            const hmac2 = new jwcl.hash.hmac(keys.m2);
            const macAesXb = yield hmac2.sign(aesXb);
            local.keys = keys;
            local.gy = gy;
            networkOut.type = 'ake3';
            networkOut.r = local.r;
            networkOut.aesXb = aesXb;
            networkOut.macAesXb = macAesXb;
        });
    };
    otr_1.ake4 = function (local, networkIn, networkOut) {
        return __awaiter(this, void 0, void 0, function* () {
            const r = networkIn.r;
            const aesr = new jwcl.cipher.aes(r);
            const gx = yield aesr.decrypt(local.aesGx);
            const hashGx = yield jwcl.hash.sha256(gx);
            if (hashGx !== local.hashGx) {
                throw 'Error ake4: hashes do not match';
            }
            const ecdh = new jwcl.ecc.ecdh(local.gy);
            const s = yield ecdh.derive(gx);
            const keys = yield akek(s);
            const hmac2 = new jwcl.hash.hmac(keys.m2);
            const verifyMacM2 = yield hmac2.verify(networkIn.macAesXb, networkIn.aesXb);
            if (verifyMacM2 !== true) {
                throw 'Error ake4: mac does not verify';
            }
            const aesc = new jwcl.cipher.aes(keys.c);
            const xB = JSON.parse(yield aesc.decrypt(networkIn.aesXb));
            const hmac1 = new jwcl.hash.hmac(keys.m1);
            const mB = yield hmac1.sign(JSON.stringify({
                gx: gx,
                gy: local.gy.publicKey,
                pubB: local.theirLongKey,
                keyIdB: xB.keyIdB
            }));
            const key = { publicKey: local.theirLongKey, privateKey: '' };
            const ecdsab = new jwcl.ecc.ecdsa(key);
            const verifySigMb = yield ecdsab.verify(xB.sigMb, mB);
            if (verifySigMb !== true) {
                throw 'Error ake4: signature does not verify';
            }
            const keyId = local.ourKeyId - 1;
            const hmac1p = new jwcl.hash.hmac(keys.m1prime);
            const mA = yield hmac1p.sign(JSON.stringify({
                gy: local.gy.publicKey,
                gx: gx,
                pubA: local.ourLongKey.publicKey,
                keyIdA: keyId
            }));
            const ecdsaa = new jwcl.ecc.ecdsa(local.ourLongKey);
            const xA = JSON.stringify({
                pubA: local.ourLongKey.publicKey,
                keyIdA: keyId,
                sigMa: yield ecdsaa.sign(mA)
            });
            const aescp = new jwcl.cipher.aes(keys.cprime);
            const aesXa = yield aescp.encrypt(xA);
            const hmac2p = new jwcl.hash.hmac(keys.m2prime);
            const macAesXa = yield hmac2p.sign(aesXa);
            local.keys = keys;
            local.gx = gx;
            local.theirKeyId = xB.keyIdB;
            local.theirKeys[local.theirKeyId] = local.gx;
            networkOut.type = 'ake4';
            networkOut.aesXa = aesXa;
            networkOut.macAesXa = macAesXa;
        });
    };
    otr_1.ake5 = function (local, networkIn, networkOut) {
        return __awaiter(this, void 0, void 0, function* () {
            const hmac2p = new jwcl.hash.hmac(local.keys.m2prime);
            const verifyMacM2p = yield hmac2p.verify(networkIn.macAesXa, networkIn.aesXa);
            if (verifyMacM2p !== true) {
                throw 'Error ake5: mac does not verify';
            }
            const aescp = new jwcl.cipher.aes(local.keys.cprime);
            const xA = JSON.parse(yield aescp.decrypt(networkIn.aesXa));
            const hmac1p = new jwcl.hash.hmac(local.keys.m1prime);
            const mA = yield hmac1p.sign(JSON.stringify({
                gy: local.gy,
                gx: local.gx.publicKey,
                pubA: local.theirLongKey,
                keyIdA: xA.keyIdA
            }));
            const key = { publicKey: local.theirLongKey, privateKey: '' };
            const ecdsaa = new jwcl.ecc.ecdsa(key);
            const verifySigMa = yield ecdsaa.verify(xA.sigMa, mA);
            if (verifySigMa !== true) {
                throw 'Error ake5: signature does not verify';
            }
            local.theirKeyId = xA.keyIdA;
            local.theirKeys[local.theirKeyId] = local.gy;
        });
    };
    otr_1.ed1 = function (local, networkIn, networkOut) {
        return __awaiter(this, void 0, void 0, function* () {
            const sendKey = local.ourKeys[local.ourKeyId - 1];
            const recvKey = local.theirKeys[local.theirKeyId];
            const sendKeyId = local.ourKeyId - 1;
            const recvKeyId = local.theirKeyId;
            const nextDh = local.ourKeys[local.ourKeyId].publicKey;
            const plaintext = local.text;
            const keys = yield edk(sendKey, recvKey);
            if (!local.sendAes) {
                local.sendAes = new jwcl.cipher.aes(keys.sendAesKey);
            }
            const aes = local.sendAes;
            const ciphertext = yield aes.encrypt(plaintext);
            const ta = JSON.stringify({
                sendKeyId: sendKeyId,
                recvKeyId: recvKeyId,
                nextDh: nextDh,
                aesMessage: ciphertext
            });
            const hmac = new jwcl.hash.hmac(keys.sendMacKey);
            const macTa = yield hmac.sign(ta);
            networkOut.type = 'ed1';
            networkOut.ta = ta;
            networkOut.macTa = macTa;
        });
    };
    otr_1.ed2 = function (local, networkIn, networkOut) {
        return __awaiter(this, void 0, void 0, function* () {
            const ta = JSON.parse(networkIn.ta);
            const macTa = networkIn.macTa;
            const sendKeyId = ta.sendKeyId;
            const recvKeyId = ta.recvKeyId;
            const sendKey = local.ourKeys[recvKeyId]; // TODO write about this as it is kinda weird
            const recvKey = local.theirKeys[sendKeyId];
            const keys = yield edk(sendKey, recvKey);
            const hmac = new jwcl.hash.hmac(keys.recvMacKey);
            const verify = yield hmac.verify(macTa, networkIn.ta);
            if (verify === false) {
                throw "ERROR ed2: mac does not verify";
            }
            if (!local.recvAes) {
                local.recvAes = new jwcl.cipher.aes(keys.recvAesKey);
            }
            const aes = local.recvAes;
            const plaintext = yield aes.decrypt(ta.aesMessage);
            local.text = plaintext;
            if (recvKeyId === local.ourKeyId) {
                delete local.sendAes;
                delete local.recvAes;
                delete local.ourKeys[local.ourKeyId - 1];
                local.ourKeyId++;
                local.ourKeys[local.ourKeyId] = yield jwcl.ecc.ecdh.generate();
            }
            if (sendKeyId === local.theirKeyId) {
                delete local.sendAes;
                delete local.recvAes;
                local.theirKeyId++;
                local.theirKeys[local.theirKeyId] = ta.nextDh;
            }
        });
    };
    class Otr {
        constructor() {
            this._convos = {};
        }
        send(ws, token, contacts, username, longKey, message) {
            return __awaiter(this, void 0, void 0, function* () {
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
                    yield otr_1.ed1(this._convos[message.to], {}, otr);
                }
                else {
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
            });
        }
        receive(ws, token, contacts, username, longKey, message) {
            return __awaiter(this, void 0, void 0, function* () {
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
                        yield otr_1.ake2(this._convos[message.from], message.otr, otr);
                        ws.send(JSON.stringify({
                            action: message.action,
                            token: token,
                            from: username,
                            to: message.from,
                            otr: otr
                        }));
                    }
                    else if (message.otr.type === 'ake2') {
                        yield otr_1.ake3(this._convos[message.from], message.otr, otr);
                        ws.send(JSON.stringify({
                            action: message.action,
                            token: token,
                            from: username,
                            to: message.from,
                            otr: otr
                        }));
                    }
                    else if (message.otr.type === 'ake3') {
                        yield otr_1.ake4(this._convos[message.from], message.otr, otr);
                        ws.send(JSON.stringify({
                            action: message.action,
                            token: token,
                            from: username,
                            to: message.from,
                            otr: otr
                        }));
                        if (this._convos[message.from].text) {
                            otr = {};
                            yield otr_1.ed1(this._convos[message.from], message.otr, otr);
                            ws.send(JSON.stringify({
                                action: message.action,
                                token: token,
                                from: username,
                                to: message.from,
                                otr: otr
                            }));
                        }
                    }
                    else if (message.otr.type === 'ake4') {
                        yield otr_1.ake5(this._convos[message.from], message.otr, {});
                        if (this._convos[message.from].text) {
                            yield otr_1.ed1(this._convos[message.from], message.otr, otr);
                            ws.send(JSON.stringify({
                                action: message.action,
                                token: token,
                                from: username,
                                to: message.from,
                                otr: otr
                            }));
                        }
                    }
                    else if (message.otr.type === 'ed1') {
                        yield otr_1.ed2(this._convos[message.from], message.otr, otr);
                        message.text = this._convos[message.from].text;
                    }
                }
                else {
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
                        yield otr_1.ake1(this._convos[message.from], message.otr, otr);
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
            });
        }
    }
    otr_1.Otr = Otr;
})(otr || (otr = {}));
