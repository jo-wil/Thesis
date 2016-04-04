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
      //TODO login user to server, the rest of this will go in callback
      if (username !== 'Alice' || password !== '1234') { // spoof login
         passwordInput.value = '';
         this.setState({error: 'Incorrect username or password'});
         return;   
      }
      //TODO set global information for logged in user
      var messageComponent = ReactDOM.render(
         <MessageComponent username={username}/>,
         document.querySelector('#container')
      );
      window.setInterval(function () {
         messageComponent.receiveMessage();
      }, 3000);

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
