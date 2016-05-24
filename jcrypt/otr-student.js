'use strict';

(function () {

var alice = {};
var bob = {};
var network = {};

alice.A = {
   privateKey: 
      'eyJjcnYiOiJQLTI1NiIsImQiOiJNSGFETS1iRkFPdlV0TWVGV'+
      'lBZS2tLR1dyQjZ5cFVONHRkbHJEZ2FFUlZBIiwiZXh0Ijp0cn'+
      'VlLCJrZXlfb3BzIjpbImRlcml2ZUtleSIsImRlcml2ZUJpdHM'+
      'iXSwia3R5IjoiRUMiLCJ4IjoicExDNkFkRlZRNU1wcWNma2di'+
      'RFFVcTZ2a21tRXp2MG9mZjJSR20tMm5TbyIsInkiOiJra095O'+
      'HdoZFQtaVBramFlMFVNcmlXWDg5RF9NN2VFLTRFc2JOdGFtSX'+
      'lBIn0=',
   publicKey: 
      'eyJjcnYiOiJQLTI1NiIsImV4dCI6dHJ1ZSwia2V5X29wcyI6W'+
      '10sImt0eSI6IkVDIiwieCI6InBMQzZBZEZWUTVNcHFjZmtnYk'+
      'RRVXE2dmttbUV6djBvZmYyUkdtLTJuU28iLCJ5Ijoia2tPeTh'+
      '3aGRULWlQa2phZTBVTXJpV1g4OURfTTdlRS00RXNiTnRhbUl5'+
      'QSJ9'
};

bob.B = {
   privateKey:
      'eyJjcnYiOiJQLTI1NiIsImQiOiIzNDRRemlWM3cwYVJSYU5BWn'+
      'VPMC0yTWY4MThvbS1Hc1BLX0tQWlBhM1hvIiwiZXh0Ijp0cnVl'+
      'LCJrZXlfb3BzIjpbImRlcml2ZUtleSIsImRlcml2ZUJpdHMiXS'+
      'wia3R5IjoiRUMiLCJ4IjoiNkpRVHg0MV9TY1B1anpJclM2VWU4'+
      'WW1ncnpxQ0VpU1M2YlJweUZxOERqayIsInkiOiJRMkFjdnY0X2'+
      'xtYzlHVGNPcllOQkFzTTUyUzlPSE9KYXJyOEltNjE3WFRJIn0=',
   publicKey:
      'eyJjcnYiOiJQLTI1NiIsImV4dCI6dHJ1ZSwia2V5X29wcyI6W1'+
      '0sImt0eSI6IkVDIiwieCI6IjZKUVR4NDFfU2NQdWp6SXJTNlVl'+
      'OFltZ3J6cUNFaVNTNmJScHlGcThEamsiLCJ5IjoiUTJBY3Z2NF'+
      '9sbWM5R1RjT3JZTkJBc001MlM5T0hPSmFycjhJbTYxN1hUSSJ9'
};


var ake1 = function () {
   var promise = new Promise(function (resolve, reject) {
      // Picks a random value r (128 bits)
      bob.r = 'E+IP6EC0+DIqgYdn4uL8mQ==';
      // Picks a random value x (at least 320 bits)
      bob.gx = {
         privateKey: 
            'eyJjcnYiOiJQLTI1NiIsImQiOiJfRFBWS1N4RmtLenE2M1Vsb'+
            'UNVQVBVZnhKWFJZWXBhdTl2V2x1NUxiSDF3IiwiZXh0Ijp0cn'+
            'VlLCJrZXlfb3BzIjpbImRlcml2ZUtleSIsImRlcml2ZUJpdHM'+
            'iXSwia3R5IjoiRUMiLCJ4IjoibTlqdENXNks1QWhvV2dQdmo0'+
            'Z0VLbTZ5TlFycnozM2pRMm1lN1hCa0RrMCIsInkiOiItZ0g5L'+
            'VkyeWN3N2JoM1BadmlYSGtCTWszVTY0ZHJDWW5wN2FQQ0lobm'+
            'FRIn0=',
         publicKey: 
            'eyJjcnYiOiJQLTI1NiIsImV4dCI6dHJ1ZSwia2V5X29wcyI6W'+
            '10sImt0eSI6IkVDIiwieCI6Im05anRDVzZLNUFob1dnUHZqNG'+
            'dFS202eU5RcnJ6MzNqUTJtZTdYQmtEazAiLCJ5IjoiLWdIOS1'+
            'ZMnljdzdiaDNQWnZpWEhrQk1rM1U2NGRyQ1lucDdhUENJaG5h'+
            'USJ9'
      };
      // Sends Alice AESr(gx), HASH(gx)
      var iv = 'OoCY96hRgIOd0Zpz';
      Promise.all([ 
         jcrypt.aes.encrypt(bob.r, iv, bob.gx.publicKey),
         jcrypt.sha256.hash(bob.gx.publicKey)
      ])
      .then(function (result) {
         network = {}; 
         network.AES_r_gx = result[0];
         network.HASH_gx = result[1];
         resolve(network);
      });
   });
   return promise;
};

var ake2 = function () {

   var promise = new Promise(function (resolve, reject) {
      // Picks a random value y (at least 320 bits)
      alice.gy = {
         privateKey:
            'eyJjcnYiOiJQLTI1NiIsImQiOiJkLVZ4OXBJUXZBSXlXQzNvV'+
            '3V4RldSMy01eTRHQjBjcTBlLVNqMkhVNnpFIiwiZXh0Ijp0cn'+
            'VlLCJrZXlfb3BzIjpbImRlcml2ZUtleSIsImRlcml2ZUJpdHM'+
            'iXSwia3R5IjoiRUMiLCJ4IjoiRS1icThtckp0enhBT29BSmFX'+
            'Z0N0QzBiV0dQWkx0dWZSdXdxeEprYlVrYyIsInkiOiIxRk0zS'+
            '25TWk9YOEV1TEkzdndLdUxwU2VuZGI1aHB5cjM4QnpVVGp3Vn'+
            'RZIn0=',
         publicKey:
            'eyJjcnYiOiJQLTI1NiIsImV4dCI6dHJ1ZSwia2V5X29wcyI6W'+
            '10sImt0eSI6IkVDIiwieCI6IkUtYnE4bXJKdHp4QU9vQUphV2'+
            'dDdEMwYldHUFpMdHVmUnV3cXhKa2JVa2MiLCJ5IjoiMUZNM0t'+
            'uU1pPWDhFdUxJM3Z3S3VMcFNlbmRiNWhweXIzOEJ6VVRqd1Z0'+
            'WSJ9'
      };
      network = {}; 
      network.gy = alice.gy.publicKey;
      resolve(network);
   });
   return promise;
};

var ake3 = function () {};
var ake4 = function () {};
var ake5 = function () {};

// Tests
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

ake1()
.then(function (result) {
   test('AES_r_gx', network.AES_r_gx, 
         'OoCY96hRgIOd0ZpzpRBlEdUR3VKylPAnGh90iszRBHfVhG0t3'+
         '7EDb4cpgIRphOou5SBp/2wc+5Fl6HfUfA6UebXpRJ2B679gK0'+
         'v3d6dCY4giaLrd2MZ9s7hbdnTntusV6GBygX9C4MvwEVeu8LY'+
         'NXKdfKUyf+WRXcDDGksmMjPBD5T15sFI9vUjLJIt/6LIdgtsI'+
         'Ea7t75PBSiOKzJzgbEzzmlMKHJnDDyGtYbNGOdjNwEb4UBGTf'+
         'iL6PPHBp9UxjWY/xIPrOroLlMLdTTmzAAFh5SeS6APu/uXUEP'+
         'u8GfesuCDA');
   test('HASH_gx', network.HASH_gx, 'UNul5OCuRl26+l4X2Iv5FNGlo1ptR9sgp1+ATYKOqLE=');
   return ake2(); 
})
.then(function (result) {
   test('gy', network.gy, 
         'eyJjcnYiOiJQLTI1NiIsImV4dCI6dHJ1ZSwia2V5X29wcyI6W'+
         '10sImt0eSI6IkVDIiwieCI6IkUtYnE4bXJKdHp4QU9vQUphV2'+
         'dDdEMwYldHUFpMdHVmUnV3cXhKa2JVa2MiLCJ5IjoiMUZNM0t'+
         'uU1pPWDhFdUxJM3Z3S3VMcFNlbmRiNWhweXIzOEJ6VVRqd1Z0'+
         'WSJ9');
});

})();
