var avril = require('avril')
, factory = avril.require('services.factory')
, mealServices = factory('meal');
module.exports = {
    index: function (req, res, next, helper) {
        mealServices.list({}, function (err, docs) {
            res.view(docs);
        });
    }
    , detail: function (req, res, next, helper) {
        mealServices.findById(req.param('id'), function (err, docs) {
            res.view(docs);
        });
    }
    , orderByTime: function () { }
    , orderByRating: function () { }
    , orderBySelling: function () { }
    , rate: function () {

    }
    , order: function () {

    }
    , comment: function () {

    }
    , ':config': {
        helper: {

        }
    }

};