'use strict';

var MessageComponent = React.createClass({
   displayName: 'MessageComponent',

   getInitialState: function getInitialState() {
      this.ws = utils.global.ws;
      this.ws.addEventListener('message', this.receiveMessage);
      this.ws.send(JSON.stringify({
         username: utils.global.username,
         token: utils.global.token
      }));
      return {
         convos: {},
         users: ['Alice', 'Bob'],
         active: ''
      };
   },
   setActive: function setActive(evt) {
      var active = evt.target.innerText;
      this.setState({ active: active });
   },
   sendMessage: function sendMessage(evt) {
      evt.preventDefault();
      var to = this.state.active;
      var messageInput = document.querySelector('#message');
      var text = messageInput.value;
      // TODO encrypt message
      this.ws.send(JSON.stringify({
         to: to,
         from: utils.global.username,
         text: text,
         token: utils.global.token
      }));
      this.updateConvo(to, 'sent', text);
      messageInput.value = '';
   },
   receiveMessage: function receiveMessage(evt) {
      var message = JSON.parse(evt.data);
      var from = message.from;
      var text = message.text;
      // TODO decrypt message
      this.updateConvo(from, 'received', text);
   },
   updateConvo: function updateConvo(who, type, text) {
      var convos = this.state.convos;
      var convo = convos[who] || [];
      convo.push({
         type: type,
         text: text
      });
      convos[who] = convo;
      this.setState({ convos: convos });
      var history = document.querySelector('#history');
      history.scrollTop = history.scrollHeight;
      //TODO not scrolling right for sent?
   },
   render: function render() {
      var convo = this.state.convos[this.state.active];
      var history = [];
      if (convo) {
         for (var i = 0; i < convo.length; i++) {
            var message = convo[i];
            var text = message.text;
            var type = message.type;
            history.push(React.createElement(
               'p',
               { key: i, className: type },
               text
            ));
         }
      }
      var users = this.state.users;
      var contacts = [];
      for (var i = 0; i < users.length; i++) {
         var user = users[i];
         if (user !== utils.global.username) {
            contacts.push(React.createElement(
               'li',
               { key: i, onClick: this.setActive },
               React.createElement(
                  'span',
                  { className: 'pointer contact' },
                  user
               )
            ));
         }
      }
      var submit = React.createElement('input', { type: 'submit', className: 'pure-button pure-button-primary', value: 'Send' });
      if (!this.state.active) {
         submit = React.createElement('input', { type: 'submit', className: 'pure-button pure-button-primary', value: 'Send', disabled: true });
      }
      return React.createElement(
         'div',
         { className: 'pure-g' },
         React.createElement('div', { className: 'pure-u-1-6' }),
         React.createElement(
            'div',
            { className: 'pure-u-1-6' },
            React.createElement(
               'h1',
               null,
               'Hi ',
               utils.global.username,
               '!'
            ),
            React.createElement(
               'h2',
               null,
               'Contacts'
            ),
            React.createElement(
               'ul',
               null,
               contacts
            )
         ),
         React.createElement(
            'div',
            { className: 'pure-u-1-3' },
            React.createElement(
               'div',
               { id: 'to' },
               React.createElement(
                  'h2',
                  null,
                  this.state.active
               )
            ),
            React.createElement(
               'div',
               { id: 'history', className: 'border' },
               history
            ),
            React.createElement(
               'form',
               { className: 'pure-form pure-form-stacked', onSubmit: this.sendMessage },
               React.createElement('textarea', { id: 'message', type: 'text', placeholder: 'Message', required: true }),
               submit
            )
         ),
         React.createElement('div', { className: 'pure-u-1-3' })
      );
   }
});