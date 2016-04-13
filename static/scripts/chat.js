'use strict';

var chat = {
   init: function () {
      app.globals.ws = new WebSocket('ws://localhost:8000/socket');
      this.log = {};
   },
   render: function () {
      this.init();
      var html = ` 
         <h2>Contacts</h2>
         <ul id="contacts"></ul>
         <div id="log"></div>
         <form id="message-form" class="pure-form pure-form-stacked">
            <input id="to" type="text" placeholder="To" required/>
            <textarea id="text" placeholder="Text" required></textarea>
            <input type="submit" class="pure-button pure-button-primary" value="Send"/>
         </form>
         <p id="error"></p>`;
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
   },
   handleRecieve: function (evt) {
      var data = JSON.parse(evt.data);
      var action = data.action;
      switch (action) {
         case 'contacts': 
            var contacts = data.contacts;
            var html = ``;
            for (var i = 0; i < contacts.length; i++) {
               var contact = contacts[i];
               if (contact !== app.globals.username) {
                  html += `<li>${contact}</li>`;
               }
            } 
            document.querySelector('#contacts').innerHTML = html;           
            break;
         case 'message':
            this.updateLog(data);
            break; 
      }
   },
   updateLog: function (message) {
      console.log(message);
      var p = document.createElement('p');
      p.innerText = message.text;
      document.querySelector('#log').appendChild(p);
   } 
}
