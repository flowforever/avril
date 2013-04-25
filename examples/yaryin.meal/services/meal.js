var avril = require('avril')
, db = avril.require('data.db')
, base = require('./serviceBase');
var exports = base(db.Meal);

avril.extend(exports, {
    top100: function (callback) {

    }
    , suggest100: function (callback) {

    }
    , latest100 : function (callback) {

    }
});

module.exports = exports;