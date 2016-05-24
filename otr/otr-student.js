'use strict';

var otr = (function () {

var otr = {};

var alice = {};
var bob = {};
var network = {};

alice.A = {
   privateKey: 
   'eyJjcnYiOiJQLTI1NiIsImQiOiI5WWlhcWd4UGk2'+
   'OGM3SDdncmV1Tm9Va2s0S0RvMVB1cVE3NF9obloy'+
   'Y1JrIiwiZXh0Ijp0cnVlLCJrZXlfb3BzIjpbImRl'+
   'cml2ZUtleSIsImRlcml2ZUJpdHMiXSwia3R5Ijoi'+
   'RUMiLCJ4IjoiWmRHemszOS04Z3gtNVhHdjB6UEVD'+
   'ekpxMWJpeHBVQUhWc0xjY2dteDRhRSIsInkiOiJq'+
   'UW81aHpvQ3Y1QmRfTTBHc3Nxb2VfcVJzRkc5WDUt'+
   'S2tiaHN1QXlHZmJvIn0='
   ,
   publicKey:
   'eyJjcnYiOiJQLTI1NiIsImV4dCI6dHJ1ZSwia2V5'+
   'X29wcyI6W10sImt0eSI6IkVDIiwieCI6IlpkR3pr'+
   'MzktOGd4LTVYR3YwelBFQ3pKcTFiaXhwVUFIVnNM'+
   'Y2NnbXg0YUUiLCJ5IjoialFvNWh6b0N2NUJkX00w'+
   'R3NzcW9lX3FSc0ZHOVg1LUtrYmhzdUF5R2ZibyJ9' 
};

bob.B = {
   privateKey:
   'eyJjcnYiOiJQLTI1NiIsImQiOiJYb3dxQ2t1NFVv'+
   'MTUxdzc2TVBDU1lIR2FxNmQxZ3owQVd4WUZIMlpV'+
   'QVUwIiwiZXh0Ijp0cnVlLCJrZXlfb3BzIjpbImRl'+
   'cml2ZUtleSIsImRlcml2ZUJpdHMiXSwia3R5Ijoi'+
   'RUMiLCJ4IjoiQ0NTSVRYZnlGS1pteWZjQTh1N3B5'+
   'TDc1WUpzR3RVUXN6VWI0Zk82dzM4RSIsInkiOiJE'+
   'U3NEUXgyV2MwdWhVSHNCUWtzSW01WDhxUG1EclVN'+
   'Zkd2M09ady1oZ1NNIn0='
   ,
   publicKey:
   'eyJjcnYiOiJQLTI1NiIsImV4dCI6dHJ1ZSwia2V5'+
   'X29wcyI6W10sImt0eSI6IkVDIiwieCI6IkNDU0lU'+
   'WGZ5RktabXlmY0E4dTdweUw3NVlKc0d0VVFzelVi'+
   'NGZPNnczOEUiLCJ5IjoiRFNzRFF4MldjMHVoVUhz'+
   'QlFrc0ltNVg4cVBtRHJVTWZHdjNPWnctaGdTTSJ9'
};

var ake1 = function () {
   var promise = new Promise(function (resolve, reject) {
      // Picks a random value r (128 bits)
      bob.r = 'K3VowlECqjHtBR3kAyx3PQ==';
      // Picks a random value x (at least 320 bits)
      bob.gx = {
         privateKey:
         'eyJjcnYiOiJQLTI1NiIsImQiOiJwTmVDajJuZmRP'+
         'V3lrYTc0RGxNUzctMXVsazVTbEZSd2Z1VjBtMTJx'+
         'dW9VIiwiZXh0Ijp0cnVlLCJrZXlfb3BzIjpbImRl'+
         'cml2ZUtleSIsImRlcml2ZUJpdHMiXSwia3R5Ijoi'+
         'RUMiLCJ4Ijoiei1rQS11TkEwVGIzNE1CZGZZTF9B'+
         'eVFoQUV2WVV3TWx4UDRKaHVuS0NESSIsInkiOiI4'+
         'cFJIbkpXVnk0ODNIX3JsMmZiOEdkMzZ4ZVRpVDdi'+
         'T0RNWmRxSHllZXJvIn0=' 
         ,
         publicKey:
         'eyJjcnYiOiJQLTI1NiIsImV4dCI6dHJ1ZSwia2V5'+
         'X29wcyI6W10sImt0eSI6IkVDIiwieCI6Inota0Et'+
         'dU5BMFRiMzRNQmRmWUxfQXlRaEFFdllVd01seFA0'+
         'Smh1bktDREkiLCJ5IjoiOHBSSG5KV1Z5NDgzSF9y'+
         'bDJmYjhHZDM2eGVUaVQ3Yk9ETVpkcUh5ZWVybyJ9' 
      };
      // Sends Alice AESr(gx), HASH(gx)
      var iv = 'Pdo23wlR6VyZrAum';
      Promise.all([ 
         jcrypt.aes.encrypt(bob.r, iv, bob.gx.publicKey),
         jcrypt.sha256.hash(bob.gx.publicKey)
      ])
      .then(function (result) {
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
         'eyJjcnYiOiJQLTI1NiIsImQiOiJwUElFSmxSTE16'+
         'ekJaQVN6Q2hDa1B4ZG52VW9RX2RuZHlDSnZPeVlK'+
         'OUFRIiwiZXh0Ijp0cnVlLCJrZXlfb3BzIjpbImRl'+
         'cml2ZUtleSIsImRlcml2ZUJpdHMiXSwia3R5Ijoi'+
         'RUMiLCJ4IjoibC11dEdPNEdyTXA1Ymwzbmp3TGJ2'+
         'THpzQ1VEQkluWDVOYnRUdGJGYzNQYyIsInkiOiJU'+
         'TDZuTWpXRWdIdjlJSXhhQm5XUXJERFhyMU92TzZq'+
         'MnRJNUZSVVdmbHZvIn0='
         ,
         publicKey:
         'eyJjcnYiOiJQLTI1NiIsImV4dCI6dHJ1ZSwia2V5'+
         'X29wcyI6W10sImt0eSI6IkVDIiwieCI6ImwtdXRH'+
         'TzRHck1wNWJsM25qd0xidkx6c0NVREJJblg1TmJ0'+
         'VHRiRmMzUGMiLCJ5IjoiVEw2bk1qV0VnSHY5SUl4'+
         'YUJuV1FyRERYcjFPdk82ajJ0STVGUlVXZmx2byJ9' 
      };
      network.gy = alice.gy.publicKey;
      resolve(network);
   });
   return promise;
};

var ake3 = function () {};
var ake4 = function () {};
var ake5 = function () {};

otr.network = network;
otr.ake1 = ake1;
otr.ake2 = ake2;
otr.ake3 = ake3;
otr.ake4 = ake4;
otr.ake5 = ake5;

return otr;

})();
