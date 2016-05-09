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

// ----- TEST CODE BELOW HERE -----

// ----- Start Utils -----
let toString = function (array) {
   let string = '';
   for (let i = 0 ; i < array.length; i++) {
      string += String.fromCharCode(array[i]);
   }
   return string; //btoa
}

let toArray = function (string) {
   //string = atob(string);
   let array = new Uint8Array(string.length);
   for (let i = 0; i < string.length; i++) {
      array[i] = string.charCodeAt(i);
   }
   return array;
}

let runner = function (generator, resolve, result) {
   let next = generator.next(result);
   if (next.done) {
      resolve('done');
      return;   
   }
   Promise.resolve(next.value).then(function (result) {
      runner(generator, resolve, result);
   });
};

let run = function (generator) {
   let promise = new Promise(function (resolve, reject) {
      runner(generator(), resolve, null);
   });
   return promise;
};

// ----- Start OTR -----

const crypto = new Crypto();
let bob = {};
let alice = {};
let network = {};

let ake1 = function* () {
   // picks random value r (128 bits)
   let r = yield crypto.generateKey({name: 'AES-CTR'});   
   // picks random value x (320 bits)
   let gx = yield crypto.generateKey({name: 'ECDH'});   
   let exportedGx = yield crypto.exportKey('jwk', gx.publicKey);
   // sends Alice AESr(gx), HASH(gx)
   let encryptedGx = yield crypto.encrypt({
      name: 'AES-CTR',
      counter: new Uint8Array(16)
   }, r, toArray(JSON.stringify(exportedGx))); 
   let digestGx = yield crypto.digest({}, toArray(JSON.stringify(exportedGx))); 
  
   //Emulate storage and network
   bob.r = r;
   bob.gx = gx;
   network.encryptedGx = encryptedGx;
   network.digestGx = digestGx;
   // Print the results 
   console.log('r', r);
   console.log('gx', gx);
   console.log('exportedGx', exportedGx);
   console.log('encryptedGx', new Uint8Array(encryptedGx));
   console.log('digestGx', new Uint8Array(digestGx));
   console.log('done with ake1');
};

let ake2 = function* () {
   // picks random value y (320 bits)
   let gy = yield crypto.generateKey({name: 'ECDH'});
   alice.gy = gy;
   // sends Bod gy
   let exportedGy = yield crypto.exportKey('jwk', gy.publicKey);

   //Emulate the network
   network.exportedGy = exportedGy;
   // Print the results 
   console.log('gy', gy);
   console.log('exportedGy', exportedGy);
   console.log('done with ake2'); 
};

let ake3 = function* () {
   // verfies that Alice's gy is a legal value
   let gy = yield crypto.importKey('jwk', network.exportedGy, {name: 'ECDH'});
   // compute s = (gy)x
   let s = yield crypto.deriveKey({
      public: gy
   }, bob.gx.privateKey);
   // TODO ...
  
   console.log('s', s);
   console.log('done with ake3'); 
};

run(ake1).then(function (result) {
   return run(ake2);
}).then(function (result) {
   return run(ake3);
}).then(function (result) {
   console.log('NETWORK', network);
});
