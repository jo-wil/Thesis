'use strict';

// Global Data Container
var Globals = {};

// Static Class
class Main {

   static run() {
      const loginView = LoginView.instance;
      loginView.render();
   }

}


// Absract Class
class View {

   constructor(template, container) {
      this._template = template;
      this._container = container;
   }

   render() {
      document.querySelector('#'+this._container).innerHTML = this._template;
      this.listeners();
   }

   listeners() {

   }

}

// Singleton Pattern
class LoginView extends View {

   constructor(template, container) {
      super(template, container);
   }

   static get instance() {
      if (!this._instance) {
         // TODO readd requred to the password field
         const template = `
            <div id="login">
               <form id="login-form">
                  <input id="username" type="text" placeholder="Username" required/>
                  <input id="password" type="password" placeholder="Password"/> 
                  <input type="submit" value="Login"/>
               </form>
               <p id="info"></p>
            </div>`;
         this._instance = new LoginView(template, 'container')
      }
      return this._instance;
   }

   listeners () {
      document.querySelector('#login-form').addEventListener('submit', function (evt) {
         evt.preventDefault();
         this.handleLogin.call(this);
      }.bind(this));
   }

   handleLogin () {
      let username = document.querySelector('#username').value;
      let password = document.querySelector('#password').value;
      fetch('/api/login', {
         method: 'POST',
         body: JSON.stringify({
            username: username,
            password: password
         })
      }).then(function (response) {
          if (response.status === 200) {
             return response.json();
          } else {
             throw 'Invalid username or password.';
          }
      }).then(function (json) {
         Globals.username = username;
         Globals.token = json.token;
         const chatView = ChatView.instance;
         chatView.render();
      });/*.catch(function (error) {
         document.querySelector('#info').innerText = error;
      });*/ // TODO handle errors a little cleaner
   }  

}

// Singleton Pattern
class ChatView extends View {

   constructor(template, container) {
      super(template, container);
      Globals.ws = new WebSocket('ws://localhost:8000/socket');
   }

   static get instance() {
      if (!this._instance) {
         const template = `
            <div id="chat">
               <p>Hi ${Globals.username}!</p> 
               <div id="contacts"></div>
               <div id="log"></div>
               <form id="message-form" class="pure-form pure-form-stacked">
                  <input id="to" type="text" placeholder="To" required/>
                  <textarea id="text" placeholder="Text" required></textarea>
                  <input type="submit" class="pure-button pure-button-primary" value="Send"/>
               </form>
               <p id="info"></p>
            </div>`;
         this._instance = new ChatView(template, 'container')
      } 
      return this._instance;
   }

   listeners () {
      document.querySelector('#message-form').addEventListener('submit', function (evt) {
         evt.preventDefault();
         this.handleSend.call(this);
      }.bind(this));
      const ws = Globals.ws;
      ws.addEventListener('message', function (evt) {
         evt.preventDefault();
         this.handleRecieve.call(this, evt);
      }.bind(this));
      ws.addEventListener('open', function () {
         ws.send(JSON.stringify({
            action: 'register',
            token: Globals.token
         }));  
      }); 
   }

   handleSend () {
      const ws = Globals.ws;
      let from = Globals.username;
      let to = document.querySelector('#to').value;
      let text = document.querySelector('#text').value;
      let data = {
         action: 'message',
         token: Globals.token,
         from: from,
         to: to,
         text: text
      };
      this.updateLog(data);
      Otr.instance.send(data).then(function (data) {
         ws.send(JSON.stringify(data));
         document.querySelector('#text').value = '';
      }.bind(this));
   }

   handleRecieve (evt) {
      let data = JSON.parse(evt.data);
      switch (data.action) {
         case 'register': 
            data.contacts.splice(data.contacts.indexOf(Globals.username), 1);
            document.querySelector('#contacts').innerText = `contacts: ${data.contacts}`;
            break;
         case 'message':
            Otr.instance.recieve(data).then(function (data) {
               if (data.text) {
                  this.updateLog(data);
               }
            }.bind(this)); // TODO catch errors
            break; 
      }
   }

   updateLog (message) {
      let p = document.createElement('p');
      p.innerText = `To: ${message.to} From: ${message.from} Text: ${message.text}`;
      document.querySelector('#log').appendChild(p);
   }

}

// Start the app on page load
window.addEventListener('load', Main.run);


// ----- Start OTR -----

const crypto = new Crypto();

// Emulate Network
let bob = {};
let alice = {};
let network = {};

let ake1 = function* () {
   
   // Picks a random value r (128 bits)
   let r = yield crypto.generateKey({
      algo: {name: 'AES-GCM'}
   }); 

   // Picks a random value x (at least 320 bits)
   let gx = yield crypto.generateKey({
      algo: {name: 'ECDH'}
   }); 

   //Sends Alice AESr(gx), HASH(gx)  
   let encryptedGx = yield crypto.encrypt({
      key: r,
      cleartext: JSON.stringify(gx.publicKey) 
   });
   let digestGx = yield crypto.digest({
      buffer: JSON.stringify(gx.publicKey)
   });
        
   // Emulate storage and network
   bob.r = r;
   bob.gx = gx;
   network.encryptedGx = encryptedGx;
   network.digestGx = digestGx;
   
   // Print the results 
   console.log('r', r);
   console.log('gx', gx);
   console.log('encryptedGx', encryptedGx);
   console.log('digestGx', digestGx);
   console.log('done with ake1');
};

let ake2 = function* () {
   
   // Picks a random value y (at least 320 bits)
   // Sends Bob gy
   let gy = yield crypto.generateKey({
      algo: {name: 'ECDH'}
   });

   // Emulate storage and network
   alice.gy = gy;
   network.gy = gy.publicKey;
  
    // Print the results 
   console.log('gy', gy);
   console.log('done with ake2'); 
};

let computeSeven = function (s) {
   let promise = new Promise (function (resolve, reject) {
      crypto.importKey({
         keyData: s,
         algo: {name: 'AES-GCM'}
      }).then(function (result) {
         return crypto.exportKey({
            format: 'raw',
            key: result
         });
      }).then(function (result) {
         let s = new Uint8Array(result); 
         let lens = new Uint8Array(4);
         lens.set([0, 0, 0, s.length]);
         let secbytes = new Uint8Array(4 + s.length); 
         secbytes.set(lens, 0); 
         secbytes.set(s, 4);
         let h2 = function (b) {
            let result = new Uint8Array(1 + 4 + s.length);
            result.set([b], 0);
            result.set(secbytes, 1);
            return result;
         };
         let next = [];
         for (let i = 0; i < 6; i++) {
            next.push(crypto.digest({buffer: Utils.toString(h2(i))}));
         }
         return Promise.all(next);
      }).then(function (result) {
         let next = [];
         next.push(Utils.toString(Utils.toArray(result[0]).slice(0,8)));
         next.push(crypto.importKey({
            format: 'raw',
            keyData: Utils.toArray(result[1]).slice(0,16),
            algo: {name: 'AES-GCM'},
            usages: ['encrypt', 'decrypt']
         }));
         next.push(crypto.importKey({
            format: 'raw',
            keyData: Utils.toArray(result[1]).slice(16,32),
            algo: {name: 'AES-GCM'},
            usages: ['encrypt', 'decrypt']
         }));
         for (let i = 2; i < 6; i++) {
            next.push( crypto.importKey({
               format: 'raw',
               keyData: Utils.toArray(result[i]),
               algo: {name: 'HMAC'},
               usages: ['sign', 'verify']
            }));
         }
         return Promise.all(next);
      }).then(function (result) {
         let next = [];
         next.push(result[0]);
         for (let i = 1; i < 7; i++) {
            next.push(crypto.exportKey({
               format: 'jwk',
               key: result[i]
            }));
         }
         return Promise.all(next);
      }).then(function (result) {
         resolve({
            ssid: result[0],
            c1: result[1],
            c1prime: result[2],
            m1: result[3],
            m2: result[4],
            m1prime: result[5],
            m2prime: result[6],
         });
      });
   });
   return promise;
}

let ake3 = function* () {
   // verfies that Alice's gy is a legal value
   let gy = network.gy;
   // compute s = (gy)x
   let s = yield crypto.deriveKey({
      algo: {
         public: gy
      },
      masterKey: bob.gx.privateKey
   });
   console.log('s', s);
   let values = yield computeSeven(s);
   console.log('values', values);
   /*let exportedS = yield crypto.exportKey('raw', s);

   // Computes two AES keys c, c' and four MAC keys m1, m1', m2, m2' by hashing s in various ways
   exportedS = new Uint8Array(exportedS);
   let lens = new Uint8Array(4);
   lens.set([0, 0, 0, exportedS.length]);
   let secbytes = new Uint8Array(4 + exportedS.length); 
   secbytes.set(lens, 0); 
   secbytes.set(exportedS, 4);
   let h2 = function (b) {
      let result = new Uint8Array(1 + 4 + exportedS.length);
      result.set([b], 0);
      result.set(secbytes, 1);
      return result; 
   }

   let hash0 = yield crypto.digest({}, h2(0));
   let ssid = hash0.slice(0,8); 
   let hash1 = yield crypto.digest({}, h2(1));
   let c1 = hash1.slice(0,16); 
   let c1prime = hash1.slice(16,32); 
   let m1 = yield crypto.digest({}, h2(2));
   let m2 = yield crypto.digest({}, h2(3)); 
   let m1prime = yield crypto.digest({}, h2(4)); 
   let m2prime = yield crypto.digest({}, h2(5)); 

   // TODO the rest of this one

   network.r = bob.r;

   console.log('s', s);
   console.log('exportedS', exportedS); 
   console.log('secbytes', secbytes); 
   console.log('ssid', new Uint8Array(ssid));
   console.log('c1', new Uint8Array(c1));
   console.log('c1prime', new Uint8Array(c1prime));
   console.log('m1', new Uint8Array(m1));
   console.log('m2', new Uint8Array(m2));
   console.log('m1prime', new Uint8Array(m1prime));
   console.log('m2prime', new Uint8Array(m2prime));
   console.log('done with ake3');*/ 
};

/*
let ake4 = function* () {

   let encryptedGx = network.encryptedGx; 
   let digestGx = network.digestGx;
   let r = network.r;
   // Decrypt gx
   let tmp = yield crypto.decrypt({
      name: 'AES-GCM',
      iv: encryptedGx.slice(0,16)
   }, r, encryptedGx.slice(16, encryptedGx.length));
   // Verifies that HASH(gx) matches the value sent earlier
   let digestCheck = yield crypto.digest({}, new Uint8Array(tmp));
   let gx = yield crypto.importKey('jwk', JSON.parse(toString(new Uint8Array(tmp))), {name: 'ECDH'});
   let s = yield crypto.deriveKey({
      public: gx
   }, alice.gy.privateKey);
   let exportedS = yield crypto.exportKey('raw', s);
   
   // Computes two AES keys c, c' and four MAC keys m1, m1', m2, m2' by hashing s in various ways
   exportedS = new Uint8Array(exportedS);
   let lens = new Uint8Array(4);
   lens.set([0, 0, 0, exportedS.length]);
   let secbytes = new Uint8Array(4 + exportedS.length); 
   secbytes.set(lens, 0); 
   secbytes.set(exportedS, 4);
   let h2 = function (b) {
      let result = new Uint8Array(1 + 4 + exportedS.length);
      result.set([b], 0);
      result.set(secbytes, 1);
      return result; 
   }

   let hash0 = yield crypto.digest({}, h2(0));
   let ssid = hash0.slice(0,8); 
   let hash1 = yield crypto.digest({}, h2(1));
   let c1 = hash1.slice(0,16); 
   let c1prime = hash1.slice(16,32); 
   let m1 = yield crypto.digest({}, h2(2));
   let m2 = yield crypto.digest({}, h2(3)); 
   let m1prime = yield crypto.digest({}, h2(4)); 
   let m2prime = yield crypto.digest({}, h2(5)); 

   console.log('digest check', equalArray(digestCheck, digestGx)); 
   console.log('s', s);
   console.log('exportedS', exportedS);
   console.log('secbytes', secbytes); 
   console.log('ssid', new Uint8Array(ssid));
   console.log('c1', new Uint8Array(c1));
   console.log('c1prime', new Uint8Array(c1prime));
   console.log('m1', new Uint8Array(m1));
   console.log('m2', new Uint8Array(m2));
   console.log('m1prime', new Uint8Array(m1prime));
   console.log('m2prime', new Uint8Array(m2prime));
};*/

Utils.run(ake1).then(function (result) {
   return Utils.run(ake2);
}).then(function (result) {
   return Utils.run(ake3);
/*}).then(function (result) {
   return run(ake4);*/
}).then(function (result) {
   console.log('ALICE', alice);
   console.log('BOB', bob);
   console.log('NETWORK', network);
});
