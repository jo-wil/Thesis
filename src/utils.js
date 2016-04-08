'use strict';

var utils = (function () {

var utils = {};

var global = {}

var ajax = function (options) {

   var method = options.method || 'GET';
   var url = options.url || '/api';
   var data = options.data;

   var promise = new Promise( function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.addEventListener('load', resolve);
      xhr.send(data); 
   });
   
   return promise;
};

utils.ajax = ajax;
utils.global = global;

return utils;
})();
