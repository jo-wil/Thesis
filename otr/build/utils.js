'use strict';
var utils;
(function (utils) {
    utils.btos = function (array) {
        let string = '';
        for (let i = 0; i < array.length; i++) {
            string += String.fromCharCode(array[i]);
        }
        return string;
    };
    utils.stob = function (string) {
        const array = new Uint8Array(string.length);
        for (let i = 0; i < string.length; i++) {
            array[i] = string.charCodeAt(i);
        }
        return array;
    };
    utils.btob64 = function (array) {
        return window.btoa(utils.btos(array));
    };
    utils.b64tob = function (string) {
        return utils.stob(window.atob(string));
    };
    utils.stob64 = function (string) {
        return window.btoa(string);
    };
    utils.b64tos = function (string) {
        return window.atob(string);
    };
})(utils || (utils = {}));
;
//# sourceMappingURL=utils.js.map