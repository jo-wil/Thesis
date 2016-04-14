'use strict';

var chat = {
   init: function () {
      app.globals.ws = new WebSocket('ws://localhost:8000/socket');
   },
   render: function () {
      this.init();
      var html = `
         <div id="chat">
            <p>Hi ${app.globals.username}!</p> 
            <div id="contacts"></div>
            <div id="log"></div>
            <form id="message-form" class="pure-form pure-form-stacked">
               <input id="to" type="text" placeholder="To" required/>
               <textarea id="text" placeholder="Text" required></textarea>
               <input type="submit" class="pure-button pure-button-primary" value="Send"/>
            </form>
            <p id="error"></p>
         </div>`;
      document.querySelector('#container').innerHTML = html;
      this.listeners();
   },
   listeners: function () {
      document.querySelector('#message-form').addEventListener('submit', function (evt) {
         this.handleSend.call(this, evt);
      }.bind(this));
      var ws = app.globals.ws;
      ws.addEventListener('message', function (evt) {
         this.handleRecieve.call(this, evt);
      }.bind(this));
      ws.addEventListener('open', function () {
         ws.send(JSON.stringify({
            action: 'register',
            token: app.globals.token
         }));  
      }); 
   },
   handleSend: function (evt) {
      evt.preventDefault();
      var ws = app.globals.ws;
      var from = app.globals.username;
      var to = document.querySelector('#to').value;
      var text = document.querySelector('#text').value;
      var message = {
         action: 'message',
         from: from,
         to: to, // TODO
         text: text
      };
      ws.send(JSON.stringify(message));
      this.updateLog(message);
      document.querySelector('#text').value = '';
   },
   handleRecieve: function (evt) {
      var data = JSON.parse(evt.data);
      var action = data.action;
      switch (action) {
         case 'contacts': 
            data.contacts.splice(data.contacts.indexOf(app.globals.username), 1);
            document.querySelector('#contacts').innerText = `contacts: ${data.contacts}`;
            break;
         case 'message':
            this.updateLog(data);
            break; 
      }
   },
   updateLog: function (message) {
      var p = document.createElement('p');
      p.innerText = `To: ${message.to} From: ${message.from} Text: ${message.text}`;
      document.querySelector('#log').appendChild(p);
   } 
}
