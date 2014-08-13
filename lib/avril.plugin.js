/**
 * Created by trump.wang on 2014/8/11.
 */
var avril = require('./avril');

module.exports = {
    getPagePlugins: function () {

    }
    , renderPlugin: function(req,res,next){

    }
    , getPluginView: function(plugName){

    }
    , init: function (avril, options) {
        var app = avril.app;

        app.get([ options.pluginRequestPath || '__avril/plugins/lists' ] , function(req,res){

        });

        app.get([ options.pluginRequestPath || '__avril/plugins/data' ] , function(req,res){

        });

        app.get([ options.pluginRequestPath || '__avril/plugins/view' ] , function(req,res){

        });
    }
};