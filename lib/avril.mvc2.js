/**
 * Created by trump.wang on 2015/1/6.
 */
var avril = require('./avril')
    , fs = require('fs-extra')
    , path = require('path');

(function(){
    function Mvc(options){
        if(!(this instanceof  Mvc)){
            return new Mvc(options);
        }

        this.config = {
            controller_dir_name: 'controllers',
            view_dir_name: 'views',
            area_dir_name: 'areas',
            share_dir_name: 'shares',
            default_area: 'home',
            default_controller: 'home',
            default_action: 'index',
            viewExtension: '.html',
            rootDir: ''
        };

        this.init(options);
    }

    var proto = Mvc.prototype;

    proto.init = function(options) {
        avril.extend(true, this.config, options);

        var self = this
            , viewHelper = new ViewHelper(self.config)
            , routerHelper = new RouterHelper(self.config);

        viewHelper.init();
        routerHelper.init();

        return this;
    };

    function ViewHelper(mvcConfig) {
        var viewCache = {};

        this.init = function (){
            cacheViews(mvcConfig.rootDir);
            return this;
        };

        this.render = function(route, data) {
        };

        function getView(route) {

        }

        function cacheViews(parentDir) {
            var viewDirs = fs.readDirSync(path.join(parentDir, mvcConfig.view_dir_name));
        }
    }

    function RouterHelper(mvcConfig) {
        this.init = function(){
            return this;
        }
    }

    /*
    * create avril mvc project
    * */
    Mvc.createProject = function() {

    };

    module.exports = Mvc;

})();