'use strict';

var login = {
   render: function () {
      var html = `<form id="login-form" class="pure-form pure-form-stacked">
                     <input id="username" type="text" placeholder="Username" required/>
                     <input id="password" type="password" placeholder="Password" required/>
                     <input type="submit" class="pure-button pure-button-primary" value="Login"/>
                  </form>
                  <p id="error"></p>`
      document.querySelector('#container').innerHTML = html;
      this.listeners();
   },
   listeners: function () {
      document.querySelector('#login-form').addEventListener('submit', function (evt) {
         evt.preventDefault();
         document.querySelector('#error').innerText = 'Invalid Credentials';
      }, false);
   }
};
