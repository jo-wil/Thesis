'use strict';

(function () {

   var main = function main() {
      // TODO check login status to decide whether to render login or message
      ReactDOM.render(React.createElement(LoginComponent, null), document.querySelector('#container'));
   };

   window.addEventListener('load', main);
})();