var avril = require('avril')
, factory = avril.require('services.factory')
, mealServices = factory('meal');
module.exports = {
    'index': function (req, res, next, helper) {
        mealServices.list({}, function (pageData) {
            console.log(pageData);
            res.view(pageData);
        }, req.param('index'));
    }
};