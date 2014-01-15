module.exports.exec = function (key) {
    var config = require('../../package.json');
    console.log(key ? config[key] : config);
}