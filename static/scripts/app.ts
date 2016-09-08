'use strict';

const globals = {};

const chat = function () {

   location.hash = '/chat';

   const html = `
      <div id="chat">
         <p>Hi ${globals.username}!</p> 
         <ul id="contacts"></ul>
         <div id="log"></div>
         <form id="message-form" class="pure-form pure-form-stacked">
            <input id="to" type="text" placeholder="To" required/>
            <textarea id="text" placeholder="Text" required></textarea>
            <input type="submit" class="pure-button pure-button-primary" value="Send"/>
         </form>
         <p id="info"></p>
      </div>`;

    document.querySelector('#container').innerHTML = html;

    const ws = new WebSocket('ws://localhost:8000/socket');
    globals.ws = ws;

    const update = function (message) {
       const p = document.createElement('p');
       p.innerText = `To: ${message.to} From: ${message.from} Text: ${message.text}`;
       document.querySelector('#log').appendChild(p);
    };

    document.querySelector('#message-form').addEventListener('submit', function (evt) {
       evt.preventDefault();
       const message = {
          action: 'message',
          token: globals.token,
          from: globals.username,
          to: document.querySelector('#to').value,
          text: document.querySelector('#text').value
       };
       update(message);
       ws.send(JSON.stringify(message));
       document.querySelector('#text').value = '';      
    }, false);

    ws.addEventListener('message', function (evt) {
       const message = JSON.parse(evt.data);
       if (message.error) {
          document.querySelector('#info').innerText = `Error: ${message.error}`;
          return;
       } 
       switch (message.action) {
          case 'register':
             document.querySelector('#contacts').innerText = ``;
             for (let i = 0; i < message.contacts.length; i++) {
                const contact = message.contacts[i];
                const username = contact.username;
                if (username !== globals.username) {
                   let status = 'Offline';
                   if (contact.publicKey) {
                      status = 'Online';
                   } 
                   const li = document.createElement('li');
                   li.innerText = `${username} (${status})`;
                   document.querySelector('#contacts').appendChild(li);
                }
             }
             break;
          case 'message':
             if (message.text) {
                update(message);
             }
             break; 
       }
    });

    ws.addEventListener('open', function (evt) {
       ws.send(JSON.stringify({
          action: 'register',
          token: globals.token,
          publicKey: globals.longKey.publicKey
       }));
    });

};

const login = function () {
   
   location.hash = '/login';
   
   const html =  
      `<div id="login" class="pure-form pure-form-stacked">
          <form id="login-form">
             <input id="username" type="text" placeholder="Username" required/>
             <input id="password" type="password" placeholder="Password"/> 
             <input type="submit" class="pure-button pure-button-primary" value="Login"/>
          </form>
          <p id="info"></p>
       </div>`;

    document.querySelector('#container').innerHTML = html;

    document.querySelector('#login-form').addEventListener('submit', function (evt) {
       evt.preventDefault();
       const username = document.querySelector('#username').value;
       const password = document.querySelector('#password').value;
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
       }).then(async function (json) {
          globals.username = username;
          globals.token = json.token;
          globals.longKey = await jwcl.ecc.ecdsa.generate();
          chat();
       }).catch(function (message) {
          document.querySelector('#info').innerText = message;
       });
    }, false);
};

const route = function () {
   if (location.hash === '#/chat' && globals.token) {
      chat();
   } else {
      login();
   }
};

const main = function () {
   if (globals.token) {
      chat();
   } else {
      login();
   }
   window.addEventListener('hashchange', route);
};

window.addEventListener('load', main);
