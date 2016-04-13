'use strict';

var login = {
   render: function () {
      var html = `
         <form id="login-form" class="pure-form pure-form-stacked">
            <input id="username" type="text" placeholder="Username" required/>
            <input id="password" type="password" placeholder="Password" required/>
            <input type="submit" class="pure-button pure-button-primary" value="Login"/>
         </form>
         <p id="error"></p>`;
      document.querySelector('#container').innerHTML = html;
      this.listeners();
   },
   listeners: function () {
      document.querySelector('#login-form').addEventListener('submit', function (evt) {
         this.handleLogin.call(this, evt);
      }.bind(this));
   },
   handleLogin: function (evt) {
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
          } else {
             throw 'Invalid username or password.';
          }
      }).then(function (json) {
         app.globals.username = username;
         app.globals.token = json.token;
         chat.render();
         return;
      }).catch(function (error) {
         document.querySelector('#error').innerText = error;
      });
   } 
};
