/**
 * Created by trump on 15-1-6.
 */
var avril = require('./avril');
var fs = require('fs-extra');
var path = require('path');

function Mvc(options){
    if(!(this instanceof  Mvc)){
        return new Mvc(options).init();
    }
    this.config = avril.extend({
        controller_dir_name: 'controllers',
        view_dir_name: 'views',
        area_dir_name: 'areas',
        share_dir_name: 'shares',
        default_area: 'home',
        default_controller: 'home',
        default_action: 'index',
        routes: {},
        viewExtension: '.html'
    }, options);
    this.app = function(){
        return this.config.app;
    }
}

Mvc.prototype.init = function() {
    return this;
};

function ViewHelper(config) {
    var viewCache = {
            normal: { }
            , areas: { }
            , other: { }
        }
        , seekDir = function(dir, cache) {
            if(!fs.existsSync(dir)){
                return false;
            }
            fs.readdirSync( dir ).forEach(function(controller){
                cache[controller] = cache[controller] || {};
                var controllerPath = path.join(dir, controller);
                if( fs.statSync(controllerPath).isDirectory() ){
                    fs.readdirSync(controllerPath).forEach(function(action){
                        var viewPath = path.join( controllerPath, action )
                            , stat = fs.statSync(viewPath);
                        stat.isFile() && ( cache[controller][action] = readAndWatch( viewPath ) );
                    });
                }
            });
        }
        , isSimpleView = function(viewName){ return viewName.indexOf('/') < 0 }
        , isStartWithDash = function(viewName) { return viewName[0] === '~'; }
        , cacheByPath = {}
        , readAndWatch = function(viewPath) {
            if(!fs.existsSync(viewPath)){
                return null;
            }
            return fs.readFileSync(viewPath);
        }
        , getView = function (viewName, controller, area, refererPath) {
            viewName = viewName + config.viewExtension;
            var seekPaths = []
                , viewResult = null
                , addSeekPath = function( viewName, controller, area ) {
                    viewResult = area && viewCache.areas[area] && viewCache.areas[area][controller] && viewCache.areas[area][controller][viewName];
                    if(!area) {
                        viewResult = viewCache.normal[controller] && viewCache.normal[controller][viewName];
                    }
                    seekPaths.push( joinSeekPath.apply(null, arguments) );
                    if(viewResult){
                        viewPath = area ? path.resolve(config.rootDir, config.area_dir_name, area, config.view_dir_name, controller, viewName)
                            : path.resolve(config.rootDir, config.view_dir_name, controller ,viewName);
                    }
                    return viewResult;
                }
                , joinSeekPath = function () {
                    var arr = Array.prototype.slice.call(arguments);
                    arr.splice(0,0, '~');
                    return arr.join('/');
                }
                , getViewResult = function (viewName, controller, area) {
                    var seekPaths = [
                        [viewName, controller, area]
                        , [viewName, config.share_dir_name, area]
                        , [viewName, config.share_dir_name, null]
                    ];

                    for( var i=0 ; !viewResult && i< seekPaths.length; i++ ){
                        if(addSeekPath.apply(null, seekPaths[i])){ break; }
                    }

                    return viewResult || seekPaths;
                }
                , pathKey = joinSeekPath.apply(null, arguments)
                , viewPath
                ;
            if(cacheByPath[pathKey]){
                return cacheByPath[pathKey];
            }
            if(isSimpleView(viewName)){
                getViewResult.apply(null, arguments);
            } else if(isStartWithDash(viewName)) {
                /* read view from app rootDir */
                viewPath = path.join(config.rootDir,  viewName.replace('~','') );
                readAndWatch(viewPath);
            } else {
                if(refererPath){
                    getViewResult.apply(null, arguments);
                }else{
                    viewPath = path.resolve( refererPath, viewName );
                    readAndWatch(viewPath);
                }
            }
            viewResult && ( cacheByPath[ pathKey ] = viewResult );
            return {
                viewResult: viewResult
                , seekPaths: seekPaths
                , viewPath: viewPath
            };
        };

    this.init = function () {
        seekDir( path.join( config.rootDir, config.view_dir_name ), viewCache.normal );
        var areaPath = path.join( config.rootDir, config.area_dir_name );
        fs.readdirSync( areaPath )
            .forEach(function(area){
                viewCache.areas[area] = viewCache[area] || {};
                seekDir( path.join(areaPath, area, config.view_dir_name) ,  viewCache.areas[area] )
            });
    };

    this.render = function(viewName, controller, area) { }

    this.getView = getView;
}

function RouteHelper(config) {
    this.init = function() {
    }
}

Mvc.ViewHelper = ViewHelper;
Mvc.RouterHelper = RouteHelper;

module.exports = Mvc;