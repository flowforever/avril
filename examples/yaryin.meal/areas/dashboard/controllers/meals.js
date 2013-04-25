var avril = require('avril')
    , factory = avril.require('services.factory')
    , mealService = factory('meal');
module.exports = {
    index: function (req, res, next, helper) {
        mealService.list({
            shopId: helper.user.shopId
        }, function (err, meals) {
            res.view(meals);
        });
    }
    , add: function (req, res, next, helper) {
        mealService.add(req.body);
    }
    , edit: function (req, res, next, helper) {
        mealService.update(req.body);
    }
    , remove: function (req, res, next, helper) {
        mealService.remove(req.param('id'));
    }
    , ':config': {
        authorize: '*'
    }
};