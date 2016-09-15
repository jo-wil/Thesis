'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
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
    const otr = globals.otr;
    const ws = new WebSocket('ws://localhost:8000/socket');
    globals.ws = ws;
    const update = function (message) {
        const p = document.createElement('p');
        p.innerText = `To: ${message.to} From: ${message.from} Text: ${message.text}`;
        document.querySelector('#log').appendChild(p);
    };
    document.querySelector('#message-form').addEventListener('submit', function (evt) {
        return __awaiter(this, void 0, void 0, function* () {
            evt.preventDefault();
            let message = {
                action: 'message',
                token: globals.token,
                from: globals.username,
                to: document.querySelector('#to').value,
                text: document.querySelector('#text').value
            };
            update(message);
            message = yield otr.send(globals.ws, globals.token, globals.contacts, globals.username, globals.longKey, message);
            ws.send(JSON.stringify(message));
            document.querySelector('#text').value = '';
        });
    }, false);
    ws.addEventListener('message', function (evt) {
        return __awaiter(this, void 0, void 0, function* () {
            let message = JSON.parse(evt.data);
            if (message.error) {
                document.querySelector('#info').innerText = `Error: ${message.error}`;
                return;
            }
            switch (message.action) {
                case 'register':
                case 'update':
                    document.querySelector('#contacts').innerText = ``;
                    globals.contacts = message.contacts;
                    for (let i = 0; i < message.contacts.length; i++) {
                        const contact = message.contacts[i];
                        const username = contact.username;
                        const status = contact.status;
                        if (username !== globals.username) {
                            const li = document.createElement('li');
                            li.innerText = `${username} (${status})`;
                            document.querySelector('#contacts').appendChild(li);
                        }
                    }
                    break;
                case 'message':
                    message = yield otr.receive(globals.ws, globals.token, globals.contacts, globals.username, globals.longKey, message);
                    if (message.text) {
                        update(message);
                    }
                    break;
            }
        });
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
    const html = `<div id="login" class="pure-form pure-form-stacked">
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
            }
            else {
                throw 'Invalid username or password.';
            }
        }).then(function (json) {
            return __awaiter(this, void 0, void 0, function* () {
                globals.username = username;
                globals.token = json.token;
                globals.longKey = yield jwcl.ecc.ecdsa.generate();
                chat();
            });
        }).catch(function (message) {
            document.querySelector('#info').innerText = message;
        });
    }, false);
};
const route = function () {
    if (location.hash === '#/chat' && globals.token) {
        chat();
    }
    else {
        login();
    }
};
const main = function () {
    globals.otr = new otr.Otr();
    if (globals.token) {
        chat();
    }
    else {
        login();
    }
    window.addEventListener('hashchange', route);
};
window.addEventListener('load', main);
