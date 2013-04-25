var avril = require('avril')
, factory = avril.require('services.factory')
, shopService = factory('shop');

module.exports = {
    index: function (req, res, next, helper) {
        res.view({});
    }
    , add: function (req, res, next, helper) {
        res.view({});
    }
    , 'add[post]': function (req, res, next, helper) {
        shopService.add(req.body, function () {
            res.view();
        });
    }
    , edit: function (req, res, next, helper) {
        res.view({
            name:'helo'
        })
    }
    , 'edit[post]': function (req, res, next, helper) {
        shopService.update(req.body, function () {
            res.view();
        });
    }
    , 'remove[post]': function (req, res, next, helper) {

    }
};