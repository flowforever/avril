var avril = require('avril')
, mealService = avril.require('services.factory')('meal');
module.exports = {
    index: function (req, res, next, helper) {
        mealService.list({}, function (err, pageObj) {
            res.view(pageObj);
        }, req.param('index'));
    }
};