'use strict';

// Global Data Container
var Globals = {};

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
            <div id="login" class="pure-form pure-form-stacked">
               <form id="login-form">
                  <input id="username" type="text" placeholder="Username" required/>
                  <input id="password" type="password" placeholder="Password"/> 
                  <input type="submit" class="pure-button pure-button-primary" value="Login"/>
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
      ws.send(JSON.stringify(data));
      document.querySelector('#text').value = '';
   }

   handleRecieve (evt) {
      let data = JSON.parse(evt.data);
      switch (data.action) {
         case 'register': 
            data.contacts.splice(data.contacts.indexOf(Globals.username), 1);
            document.querySelector('#contacts').innerText = `Contacts: ${data.contacts}`;
            break;
         case 'message':
            if (data.text) {
               this.updateLog(data);
            }
            break; 
      }
   }

   updateLog (message) {
      let p = document.createElement('p');
      p.innerText = `To: ${message.to} From: ${message.from} Text: ${message.text}`;
      document.querySelector('#log').appendChild(p);
   }

}

// Entry into the application
const run = function () {
   LoginView.instance.render();
}

// Start the app on page load
window.addEventListener('load', run);