'use strict';
var globals = {};
var chat = function () {
    location.hash = '/chat';
    var html = "\n      <div id=\"chat\">\n         <p>Hi " + globals.username + "!</p> \n         <div id=\"contacts\"></div>\n         <div id=\"log\"></div>\n         <form id=\"message-form\" class=\"pure-form pure-form-stacked\">\n            <input id=\"to\" type=\"text\" placeholder=\"To\" required/>\n            <textarea id=\"text\" placeholder=\"Text\" required></textarea>\n            <input type=\"submit\" class=\"pure-button pure-button-primary\" value=\"Send\"/>\n         </form>\n         <p id=\"info\"></p>\n      </div>";
    document.querySelector('#container').innerHTML = html;
    var ws = new WebSocket('ws://localhost:8000/socket');
    globals.ws = ws;
    var update = function (message) {
        var p = document.createElement('p');
        p.innerText = "To: " + message.to + " From: " + message.from + " Text: " + message.text;
        document.querySelector('#log').appendChild(p);
    };
    document.querySelector('#message-form').addEventListener('submit', function (evt) {
        evt.preventDefault();
        var message = {
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
        var message = JSON.parse(evt.data);
        if (message.error) {
            document.querySelector('#info').innerText = "Error: " + message.error;
            return;
        }
        switch (message.action) {
            case 'register':
                message.contacts.splice(message.contacts.indexOf(globals.username), 1);
                document.querySelector('#contacts').innerText = "Contacts: " + message.contacts;
                break;
            case 'message':
                if (message.text) {
                    update(message);
                }
                break;
        }
    });
    ws.addEventListener('open', function () {
        ws.send(JSON.stringify({
            action: 'register',
            token: globals.token
        }));
    });
};
var login = function () {
    location.hash = '/login';
    var html = "<div id=\"login\" class=\"pure-form pure-form-stacked\">\n          <form id=\"login-form\">\n             <input id=\"username\" type=\"text\" placeholder=\"Username\" required/>\n             <input id=\"password\" type=\"password\" placeholder=\"Password\"/> \n             <input type=\"submit\" class=\"pure-button pure-button-primary\" value=\"Login\"/>\n          </form>\n          <p id=\"info\"></p>\n       </div>";
    document.querySelector('#container').innerHTML = html;
    document.querySelector('#login-form').addEventListener('submit', function (evt) {
        evt.preventDefault();
        var username = document.querySelector('#username').value;
        var password = document.querySelector('#password').value;
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
            globals.username = username;
            globals.token = json.token;
            chat();
        }).catch(function (message) {
            document.querySelector('#info').innerText = message;
        });
    }, false);
};
var route = function () {
    if (location.hash === '#/chat' && globals.token) {
        chat();
    }
    else {
        login();
    }
};
var main = function () {
    if (globals.token) {
        chat();
    }
    else {
        login();
    }
    window.addEventListener('hashchange', route);
};
window.addEventListener('load', main);
