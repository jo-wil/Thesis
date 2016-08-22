'use strict';

class Utils {

   static toString (array) {
      let string = '';
      for (let i = 0 ; i < array.length; i++) {
         string += String.fromCharCode(array[i]);
      }
      return string; 
   }

   static toArray (string) {
      let array = new Uint8Array(string.length);
      for (let i = 0; i < string.length; i++) {
         array[i] = string.charCodeAt(i);
      }
      return array;
   }

   static run (generator) {
      const runner = function (generator, resolve, result) {
         let next = generator.next(result);
         if (next.done) {
            resolve('done');
            return;   
         }
         Promise.resolve(next.value).then(function (result) {
            runner(generator, resolve, result);
         });
      };
      const promise = new Promise(function (resolve, reject) {
         runner(generator(), resolve, null);
      });
      return promise;
   }
}
