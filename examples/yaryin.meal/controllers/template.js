var avril = require('avril')
, appConfig = avril.getConfig('app');
module.exports = {
    'get': function (req, res, next, helper) {
        var name = req.param('name');
        res.view(name);
    }
    , 'version': function (req, res, next, helper) {
        res.send(appConfig.version);
    }
};