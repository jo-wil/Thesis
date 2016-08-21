'use strict';

const main = function (): void {
   //jwcl.test.run();
   otr.test.run()
   .then(function () {
      console.log('DONE');
   });
};

window.addEventListener('load', main);
