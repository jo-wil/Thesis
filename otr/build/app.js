'use strict';
const main = function () {
    Promise.all([jwcl.hash.sha1('the small brown fox jumped over the lazy dog'),
        jwcl.hash.sha256('the small brown fox jumped over the lazy dog')])
        .then(function (results) {
        console.log(results[0]);
        console.log(results[1]);
    });
    const key = jwcl.random(16);
    const aes = new jwcl.cipher.aes(key);
    aes.encrypt('the small brown fox jumped over the lazy dog')
        .then(function (result) {
        console.log(result);
        return aes.decrypt(result);
    })
        .then(function (result) {
        console.log(result);
    });
};
window.addEventListener('load', main);
//# sourceMappingURL=app.js.map