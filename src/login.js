'use strict';

var LoginComponent = React.createClass({
   getInitialState: function () {
      return {error: ''}
   },
   login: function (evt) {
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
            var ws = new WebSocket('ws://localhost:8000/api/messaging');
            ws.addEventListener('open', function () {
               var messageComponent = ReactDOM.render(
                  <MessageComponent username={username}/>,
                  document.querySelector('#container')
               );
            });
            utils.global.ws = ws;
         } else {
            this.setState({error: 'Incorrect username or password'});
            passwordInput.value = '';
         } 
      }.bind(this)).catch(function (err) {
         this.setState({error: err});
      }.bind(this));
   },
   render: function () {
      return (
         <div className="pure-g">
            <div className="pure-u-1-3"></div>
            <div className="pure-u-1-3">
               <h1>Login</h1>
               <form className="pure-form pure-form-stacked" onSubmit={this.login}>
                  <input id="username" type="text" placeholder="Username" required/>
                  <input id="password" type="password" placeholder="Password" required/>
                  <input type="submit" className="pure-button pure-button-primary" value="Login"/>
               </form>
               <p>{this.state.error}</p>
            </div>
            <div className="pure-u-1-3">
            </div>
         </div>
      );
   }
});
