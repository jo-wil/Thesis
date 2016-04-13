'use strict';

var chat = {
   init: function () {
      var ws = new WebSocket('ws://localhost:8000/socket');
      ws.addEventListener('message', this.handleRecieve);
      ws.addEventListener('open', function () {
         ws.send(JSON.stringify({
            action: 'register',
            token: app.globals.token
         }));  
      });
   },
   render: function () {
      var html = ` 
         <h2>Contacts</h2>
         <ul id="contacts"></ul>
         <div id="log"></div>
         <form class="pure-form pure-form-stacked">
            <input id="to" type="text" placeholder="To" required readonly/>
            <textarea id="text" placeholder="Text" required></textarea>
            <input type="submit" class="pure-button pure-button-primary" value="Send"/>
         </form>
         <p id="error"></p>`;
      document.querySelector('#container').innerHTML = html;
      this.listeners();
      this.init();
   },
   listeners: function () {
         
   },
   handleRecieve: function (evt) {
      var data = JSON.parse(evt.data);
      var action = data.action;
      switch (action) {
         case 'contacts': 
            var contacts = data.contacts;
            var html = ``;
            var active = '';
            for (var i = 0; i < contacts.length; i++) {
               var contact = contacts[i];
               if (active === '' && contact !== app.globals.username) {
                  active = contact;
               }
               if (contact !== app.globals.username) {
                  html += `<li>${contact}</li>`;
               }
            } 
            document.querySelector('#to').value = active;           
            document.querySelector('#contacts').innerHTML = html;           
            break; 
      }
   } 
}
