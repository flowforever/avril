var avril = require('avril')
    , db = avril.require('data.db')
    , base = require('./serviceBase');
module.exports = function (name, modelName) {
    var service;
    try {
        service = require('./' + name);
    } catch (E) {
        service = base(db[modelName]);
    }
    return service;
};