'use strict';

(function () {

var test = function (name, result, expected) {
   if (expected !== result) {
      console.log(
         name + '... fail\n' +
         '   result: ' + result + '\n' +
         '   expected: ' + expected
      );
      return;
   }
   console.log(name + '... pass');
};

otr.ake1()
.then(function (result) {
   test('AES_r_gx', otr.network.AES_r_gx,
   'Pdo23wlR6VyZrAum+eeGbWuY0qT0yUoIyIpZ2+P2'+
   '2m5Kl80SCIPNgyk+cXYvufJGBXdexhwJW+4b4624'+
   'n7R2MmMaqknopru12YKYA9aquiB4UNaSboHwDLL2'+
   'apgTWcw9uEGAw8q5DuvlJGbkCBXuOTCRHaxA7aqX'+
   '8kB22amknw4mNa0nZyMp24caHAfCl3vk6X8tDlS7'+
   'xXNGkFAChWl2sD06TnAGl73XQHtU+Evc8eVQMZcZ'+
   'dOEPJR4daTyxC9k/Zr+q+52AZj8IjI1bCwCgBk8U'+
   'obpPJwXXQi7gW1Nc+cSBDFTb');
   test('HASH_gx', otr.network.HASH_gx, 
   'Jj2UlB1trKHZUIPKn22kb+MIN/FW/tZLtwmd43Jn'+
   'meg=');
   return otr.ake2(); 
})
.then(function (result) {
   test('gy', otr.network.gy, 
   'eyJjcnYiOiJQLTI1NiIsImV4dCI6dHJ1ZSwia2V5'+
   'X29wcyI6W10sImt0eSI6IkVDIiwieCI6ImwtdXRH'+
   'TzRHck1wNWJsM25qd0xidkx6c0NVREJJblg1TmJ0'+
   'VHRiRmMzUGMiLCJ5IjoiVEw2bk1qV0VnSHY5SUl4'+
   'YUJuV1FyRERYcjFPdk82ajJ0STVGUlVXZmx2byJ9');
});

})();
