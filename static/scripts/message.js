'use strict';

var MessageComponent = React.createClass({
   displayName: 'MessageComponent',

   getInitialState: function getInitialState() {
      this.ws = utils.global.ws;
      this.ws.addEventListener('message', this.receiveMessage);
      return {
         convos: {},
         active: 'Bob'
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
      this.ws.send(JSON.stringify({ to: to, text: text }));
      this.updateConvo(to, 'sent', text);
      messageInput.value = '';
   },
   receiveMessage: function receiveMessage(evt) {
      var from = 'Bob';
      var text = evt.data;
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
               this.props.username,
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
               React.createElement(
                  'li',
                  { onClick: this.setActive },
                  React.createElement(
                     'span',
                     { className: 'pointer contact' },
                     'Bob'
                  )
               )
            )
         ),
         React.createElement(
            'div',
            { className: 'pure-u-1-3' },
            React.createElement(
               'form',
               { className: 'pure-form pure-form-stacked', onSubmit: this.sendMessage },
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
               React.createElement('textarea', { id: 'message', type: 'text', placeholder: 'Message', required: true }),
               React.createElement('input', { type: 'submit', className: 'pure-button pure-button-primary', value: 'Send' })
            )
         ),
         React.createElement('div', { className: 'pure-u-1-3' })
      );
   }
});