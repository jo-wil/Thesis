'use strict';

var LoginComponent = React.createClass({
   displayName: 'LoginComponent',

   getInitialState: function getInitialState() {
      return { error: '' };
   },
   login: function login(evt) {
      evt.preventDefault();
      var username = document.querySelector('#username').value;
      var passwordInput = document.querySelector('#password');
      var password = passwordInput.value;
      utils.ajax({
         method: 'POST',
         url: '/api/login',
         data: JSON.stringify({
            username: username,
            password: password
         })
      }).then(function (evt) {
         var request = evt.target;
         var token = request.response;
         if (request.status === 200) {
            utils.global.token = request.response;
            utils.global.username = username;
            var ws = new WebSocket('ws://localhost:8000/api/messaging');
            ws.addEventListener('open', function () {
               var messageComponent = ReactDOM.render(React.createElement(MessageComponent, null), document.querySelector('#container'));
            });
            utils.global.ws = ws;
         } else {
            this.setState({ error: 'Incorrect username or password' });
            passwordInput.value = '';
         }
      }.bind(this)).catch(function (err) {
         this.setState({ error: err });
      }.bind(this));
   },
   render: function render() {
      return React.createElement(
         'div',
         { className: 'pure-g' },
         React.createElement('div', { className: 'pure-u-1-3' }),
         React.createElement(
            'div',
            { className: 'pure-u-1-3' },
            React.createElement(
               'h1',
               null,
               'Login'
            ),
            React.createElement(
               'form',
               { className: 'pure-form pure-form-stacked', onSubmit: this.login },
               React.createElement('input', { id: 'username', type: 'text', placeholder: 'Username', required: true }),
               React.createElement('input', { id: 'password', type: 'password', placeholder: 'Password', required: true }),
               React.createElement('input', { type: 'submit', className: 'pure-button pure-button-primary', value: 'Login' })
            ),
            React.createElement(
               'p',
               null,
               this.state.error
            )
         ),
         React.createElement('div', { className: 'pure-u-1-3' })
      );
   }
});