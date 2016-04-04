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
      //TODO login user to server, the rest of this will go in callback
      if (username !== 'Alice' || password !== '1234') {
         // spoof login
         passwordInput.value = '';
         this.setState({ error: 'Incorrect username or password' });
         return;
      }
      //TODO set global information for logged in user
      var messageComponent = ReactDOM.render(React.createElement(MessageComponent, { username: username }), document.querySelector('#container'));
      window.setInterval(function () {
         messageComponent.receiveMessage();
      }, 3000);
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