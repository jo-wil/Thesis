'use strict';

var g_key;

var otr = {
   utils: {
      hton: function (options) {
         var array = options.array;
         var tmp = [];
         for (var i = 0; i < array.length; i++) {
            tmp.push(array[i]);
         }
         return tmp;
      },
      ntoh: function (options) {
         var array = options.array;
         var tmp = new Uint8Array(array.length);
         for (var i = 0; i < array.length; i++) {
            tmp[i] = array[i];
         }
         return tmp;
      }
   },
   send: function (data) {
      var promise = new Promise(function (resolve, reject) {
         var iv = window.crypto.getRandomValues(new Uint8Array(16));
         window.crypto.subtle.generateKey({
               name: "AES-CBC",
               length: 128,
            },
            true,
            ["encrypt", "decrypt"]
         ).then(function(key){         
            g_key = key;
            var encoder = new TextEncoder();
            var plaintext = encoder.encode(data.text);
            return window.crypto.subtle.encrypt({
                  name: 'AES-CBC',
                  iv: iv,
               },
               g_key,
               plaintext
            );
         }).then(function(ciphertext) {
            delete data.text;
            ciphertext = new Uint8Array(ciphertext);
            data.otr = {
               iv: this.utils.hton({
                  array: iv
               }),
               ciphertext: this.utils.hton({
                  array: ciphertext
               })
            }
            resolve(data);
         }.bind(this));
      }.bind(this));
      return promise;
   },
   recieve: function (data) {
      var promise = new Promise(function (resolve, reject) {
         var iv = this.utils.ntoh({
            array: data.otr.iv
         });
         var ciphertext = this.utils.ntoh({
            array: data.otr.ciphertext
         });
         window.crypto.subtle.decrypt({
               name: 'AES-CBC',
               iv: iv, 
            },
            g_key,
            ciphertext
         ).then(function (plaintext) {
            var decoder = new TextDecoder();
            var plaintext = decoder.decode(plaintext);
            data.text = plaintext;
            delete data.otr;
            resolve(data); 
         });
      }.bind(this));
      return promise;
   }
}
