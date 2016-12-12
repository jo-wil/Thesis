'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var app;
(function (app) {
    app.globals = {};
    app.chat = function () {
        location.hash = '/chat';
        const html = `
         <div id="chat">
            <p>Hi ${app.globals.username}!</p> 
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
        const otr = app.globals.otr;
        const ws = new WebSocket('ws://localhost:8000/socket');
        app.globals.ws = ws;
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
                    token: app.globals.token,
                    from: app.globals.username,
                    to: document.querySelector('#to').value,
                    text: document.querySelector('#text').value
                };
                update(message);
                message = yield otr.send(app.globals.ws, app.globals.token, app.globals.contacts, app.globals.username, app.globals.longKey, message);
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
                        app.globals.contacts = message.contacts;
                        for (let i = 0; i < message.contacts.length; i++) {
                            const contact = message.contacts[i];
                            const username = contact.username;
                            const status = contact.status;
                            if (username !== app.globals.username) {
                                const li = document.createElement('li');
                                li.innerText = `${username} (${status})`;
                                document.querySelector('#contacts').appendChild(li);
                            }
                        }
                        break;
                    case 'message':
                        message = yield otr.receive(app.globals.ws, app.globals.token, app.globals.contacts, app.globals.username, app.globals.longKey, message);
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
                token: app.globals.token,
                publicKey: app.globals.longKey.publicKey
            }));
        });
    };
    app.login = function () {
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
                    app.globals.username = username;
                    app.globals.token = json.token;
                    app.globals.longKey = yield jwcl.ecc.ecdsa.generate();
                    app.chat();
                });
            }).catch(function (message) {
                document.querySelector('#info').innerText = message;
            });
        }, false);
    };
})(app || (app = {}));
const route = function () {
    if (app.globals.token) {
        app.chat();
    }
    else {
        app.login();
    }
};
const main = function () {
    app.globals.otr = new otr.Otr();
    route();
    window.addEventListener('hashchange', route);
};
window.addEventListener('load', main);
