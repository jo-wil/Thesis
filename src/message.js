'use strict';

var MessageComponent = React.createClass({
   getInitialState: function () {
      this.ws = utils.global.ws;
      this.ws.addEventListener('message', this.receiveMessage);
      return {
         convos: {},
         active: 'Bob'
      };
   },
   setActive: function (evt) {
      var active = evt.target.innerText;
      this.setState({active: active});
   },
   sendMessage: function (evt) {
      evt.preventDefault();
      var to = this.state.active;
      var messageInput = document.querySelector('#message');
      var text = messageInput.value;
      // TODO encrypt message
      this.ws.send(JSON.stringify({to: to, text: text}));
      this.updateConvo(to, 'sent', text);
      messageInput.value = '';
   },
   receiveMessage: function (evt) {
      var from = 'Bob';
      var text = evt.data; 
      // TODO decrypt message
      this.updateConvo(from, 'received', text);
   },
   updateConvo: function (who, type, text) {
      var convos = this.state.convos;
      var convo =  convos[who] || [];
      convo.push({
         type: type,
         text: text 
      });
      convos[who] = convo; 
      this.setState({convos: convos});
      var history = document.querySelector('#history');
      history.scrollTop = history.scrollHeight;
      //TODO not scrolling right for sent?
   },
   render: function () {
      var convo = this.state.convos[this.state.active];
      var history = [];
      if (convo) { 
         for (var i = 0; i < convo.length; i++) {
            var message = convo[i];
            var text = message.text;
            var type = message.type;
            history.push(<p key={i} className={type}>{text}</p>);
         }
      }
      return (
         <div className="pure-g">
            <div className="pure-u-1-6">
            </div>
            <div className="pure-u-1-6">
               <h1>Hi {this.props.username}!</h1>
               <h2>Contacts</h2>
               <ul>
                  <li onClick={this.setActive}><span className="pointer contact">Bob</span></li>
               </ul>
            </div>
            <div className="pure-u-1-3">
               <form className="pure-form pure-form-stacked" onSubmit={this.sendMessage}>
                  <div id="to"><h2>{this.state.active}</h2></div>
                  <div id="history" className="border">{history}</div>
                  <textarea id="message" type="text" placeholder="Message" required/>
                  <input type="submit" className="pure-button pure-button-primary" value="Send"/>
               </form>
            </div>
            <div className="pure-u-1-3">
            </div>
         </div>
      );
   }
});
