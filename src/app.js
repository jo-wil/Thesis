'use strict';

(function () {

var main = function () {
   // TODO check login status to decide whether to render login or message
   ReactDOM.render(
      <LoginComponent/>,
      document.querySelector('#container')
   );
};

window.addEventListener('load', main);

})();
