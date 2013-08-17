var avril = require('./avril')

, querystring = require('querystring')

, fs = require('fs-extra')

, path = require('path');

//#region private
var mvcConfig = {
    controller_dir_name: 'controllers',
    view_dir_name: 'views',
    area_dir_name: 'areas',
    share_dir_name: 'shares',
    default_area: 'home',
    default_controller: 'home',
    default_action: 'index',
    routes: {},
    viewExtension: '.cshtml'
}

function getRouteName(action, controller, area) {
    var route = area ? avril.url.join(area, controller, action) : avril.url.join(controller, action);
    if (!(new RegExp('^/').test(route))) {
        route = '/' + route;
    }
    return route;
}

var _attrReg = /(\[[^\[\]]*\])/gi;

function getPureAction(action) {
    if (typeof action !== 'string') { return action; }
    return action.replace(_attrReg, '');
}

function getPureActionForView(action) {
    action = getPureAction(action);
    var sp = action.indexOf('/:');
    if (sp < 0) {
        return action;
    }
    return action.substring(0, sp);
}

var handleRouteName = (function () {
    var cache = {};
    function addPre(route) {
        if (!(new RegExp('^/').test(route))) {
            route = '/' + route;
        }
        return route;
    }
    return function (action, controller, area) {
        var key = getPureAction(action) + '-' + controller + '-' + area;
        if (!cache[key]) {
            var arr = [];
            var route = getRouteName(action, controller, area);
            route = addPre(route);
            arr.push(route);
            action = getPureAction(action);
            if (action == mvcConfig.default_action) {
                route = route.replace(new RegExp('/' + action + '$'), '');
                route = addPre(route);
                arr.push(route);
                if (controller == mvcConfig.default_controller) {
                    route = route.replace(new RegExp('/' + controller + '$'), '');
                    route = addPre(route);
                    arr.push(route);
                    if (area == mvcConfig.default_area) {
                        route = route.replace(new RegExp('/' + area + '$'), '');
                        route = addPre(route);
                        arr.push(route);
                    }
                }
            }
            cache[key] = arr;
        }
        return cache[key];
    }
})();

//#endregion

//#region public

//#region  MVC

function Mvc() {
    if (!(this instanceof Mvc)) {
        return new Mvc();
    }

    //#region private
    var rootDir, _app, mvc = this
        , funcs = mvc.funcs = {
            area: {}
            , 'default': {}
        }
        , addToFuncs = function (area, controller, action, funcObj) {
            if (area) {
                funcs.area[area] = funcs.area[area] || {};
                funcs.area[area][controller] = funcs.area[area][controller] || {};
                funcs.area[area][controller][action] = funcObj;
            } else {
                funcs.default[controller] = funcs.default[controller] || {};
                funcs.default[controller][action] = funcObj;
            }

        }
        , initRoutes = function () {
            Object.keys(mvc.routes || {}).forEach(function (key, index) {
                var route = mvc.routes[key];
                if (route && route.controller && route.action && !route.inited) {
                    var funcObj = mvc.getFunc(route.area, route.controller, route.action);
                    if (funcObj) {
                        route.inited = true;
                        if (!route.method) { route.method = 'get' };
                        if (route.method == '*') { route.method = 'get,post,delete,put' }
                        route.method = route.method.toLowerCase();
                        route.method.split(',').forEach(function (method) {
                            mvc.app[method](key, funcObj.func);
                        });
                    }
                }
            });
        };

    function registerArea(app) {
        var areaDir = path.join(rootDir, mvcConfig.area_dir_name);
        fs.readdir(areaDir, function (err, dirs) {
            if (!err) {
                dirs.forEach(function (area) {
                    registerController(app, path.join(areaDir, area, mvcConfig.controller_dir_name), area);
                    preCompileShareViews(area);
                });
            }
        });
    }

    function registerController(app, dir, area) {
        dir = dir || path.join(rootDir, mvcConfig.controller_dir_name);
        fs.readdir(dir, function (err, files) {
            if (!err) {
                files.forEach(function (controller) {
                    fs.stat(path.join(dir, controller), function (err, stat) {
                        if (err) {
                            avril.log(err);
                        } else {
                            if (stat && stat.isFile()) {
                                registerAction(app, controller, area, dir);
                                preCompileControllerViews(controller, area);
                            }
                        }
                    });
                });
            }
        });
    }

    function registerAction(app, controller, area, dir) {

        var name = controller = controller.replace('.js', '')

            , requirePath = path.join(dir, controller);

        var actions = require(requirePath);

        if (!actions[':config']) {
            actions[':config'] = {};
        }

        actions[':config'].rootDir = rootDir;

        actions[':config'].requirePath = requirePath;

        Object.keys(actions).map(function (action) {
            var fn = actions[action];
            if (avril.isFunction(fn)) {
                var fnObj = parseAction(action, controller, area, fn, actions[':config'], actions),
	            method = fnObj.attrs.method,
	            action = fnObj.name,
	            routeStr = getRouteName(action, controller, area),
	            routeObj = mvcConfig.routes[routeStr] || routeStr,
	            route;

                addToFuncs(area, controller, action, fnObj);

                initRoutes();

                if (typeof routeObj == 'string') {
                    route = routeObj;
                } else if (typeof routeObj == 'function') {
                    route = routeObj(app, action, name, area);
                }
                var nRoute = handleRouteName(action, controller, area);
                for (var i = 0; i < nRoute.length; i++) {
                    if (method.indexOf('|')) {
                        method.split('|').forEach(function (k) {
                            app[k](nRoute[i], fnObj.func);
                        });
                    } else {
                        app[method](nRoute[i], fnObj.func);
                    }
                }
            }

        });

    }

    function parseAction(action, controller, area, fn, ctrlCfgCache, actions) {
        return {
            func: function (req, res, next) {

                var self = this

                , routes = (function () {

                    var result = {
                        area: area
                        , controller: controller
                        , action: getPureActionForView(action)
                        , ':action': action
                    }

                    var paramsInAction = action.split('/:');
                    paramsInAction.shift();
                    if (paramsInAction.length) {
                        paramsInAction.forEach(function (key) {
                            result[key] = req.param(key);
                        });
                    }

                    return result;
                })()

                , helper = new Helper(_app, req, res, routes, ctrlCfgCache, mvc);

                var args = [req, res, next, helper];

                res.view = function () {

                    var viewName = action
                        , options = {
                            model: null
                        };

                    switch (arguments.length) {
                        case 1: {
                            if (typeof arguments[0] == 'string') {
                                viewName = arguments[0];
                            } else if (typeof arguments[0] == 'object') {
                                options.model = arguments[0];
                            }
                            break;
                        }
                        case 2: {
                            if (typeof arguments[0] == 'string') {
                                viewName = arguments[0];
                                options.model = arguments[1];
                            } else {
                                options.model = arguments[0];
                                viewName = arguments[1];
                            }
                            break;
                        }
                    }

                    options.helper = helper;
                    options.url = helper.url;
                    options.html = helper.html;
                    options.auth = helper.authorize;
                    options.view = helper.viewHelper;
                    options.render = function (viewName, opts) {
                        var r = '';
                        try {
                            r = helper.viewHelper.render(viewName, avril.extend(options, opts));
                        } catch (E) {
                            r = E.message;
                        }
                        return r
                    }

                    var str = '';

                    try {
                        str = helper.viewHelper.render(viewName, options);
                    } catch (E) {
                        str = E.message;
                    }

                    res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });

                    res.end(str);
                }

                var orgSend = res.send;

                res.send = function () {
                    try {
                        var jsonpcallback = req.param('jsonpcallback');
                        if (jsonpcallback) {
                            res.writeHead(200, { 'Content-Type': 'text/javascript' });
                            res.end(jsonpcallback + '(' + JSON.stringify(obj) + ')');
                        } else {
                            orgSend.apply(this, arguments);
                        }
                    } catch (E) { avril.log(E); }
                }

                var orgParam = req.param;
                req.param = function (key) {
                    var param = orgParam.apply(this, arguments);
                    if (!param) {
                        param = routes[key];
                    }
                    return param;
                }

                helper.authorize.auth(function (isLogin) {
                    helper.authorize.isLogin = isLogin;
                    if (helper.authorize.onUnAuthorize && !isLogin && getAttribute(action, ctrlCfgCache).authorize) {
                        helper.authorize.onUnAuthorize.apply(helper.authorize, args);
                    } else {
                        fn.apply(actions, args);
                    }
                });

            }
            , attrs: getAttribute(action, ctrlCfgCache)
            , name: getPureAction(action)
        };

    }

    function getAttribute(str, cfg) {
        var actionConfig = cfg[str] || (cfg[str] = {})
        , s = _attrReg.exec(str)
        , splitAttr = function (str) {
            var attr = str.substring(1, str.length - 1).split('=');
            return [attr[0], attr[1] || attr[0]];
        }
        , all = {};
        while (s) {
            var sp = splitAttr(s[0]);
            all[sp[0]] = sp[1] || sp[0];
            s = _attrReg.exec(str);
        }
        if (!all.method) {
            var arr = [];
            all.post && arr.push(all.post);
            all.get && arr.push(all.get);
            all.put && arr.push(all.put);
            all.delete && arr.push(all.delete);
            all.method = arr.length ? arr.join('|') : 'get';
        }

        var authorize = false;
        if (typeof cfg.authorize != 'undefined') {
            if (cfg.authorize === '*') {
                if (all.authorize != 'false') {
                    authorize = true;
                }
            }
            else {
                if (all.authorize == 'true') {
                    authorize = true;
                }
            }
        }
        all.authorize = authorize;
        return all;
    }

    function preCompileControllerViews(controller, area) {
        ViewHelper.watchDir(mvc, controller, area);
    }

    function preCompileShareViews(area) {
        if (area) {
            ViewHelper.watchDir(mvc, mvcConfig.share_dir_name, area);
        } else {
            ViewHelper.watchDir(mvc, mvcConfig.share_dir_name);
        }
    }

    //#endregion

    //#region public

    this.getFunc = function (area, controller, action) {
        var areaObj = (area ? funcs.area[area] : funcs.default);
        if (!areaObj) { return undefined; }
        var controllerObj = areaObj[controller];
        return controllerObj ? controllerObj[action] : undefined;
    }

    this.init = function (avril, appConfig) {

        _app = appConfig.app;

        Mvc.appConfig = appConfig;

        avril.extend(this, appConfig);

        rootDir = this.rootDir = avril._rootDir;

        registerArea(_app);

        registerController(_app);

        preCompileShareViews();

        return this;
    }

    //#endregion

}

//#endregion


//#region ViewHelper
function ViewHelper(app, req, res, routes, ctrlCfgCache, mvc) {
    if (!(this instanceof ViewHelper)) {
        return new ViewHelper(app, req, res, routes, ctrlCfgCache, mvc);
    }
    this.init(app, req, res, routes, ctrlCfgCache, mvc);
}

(function () {
    var viewCache = ViewHelper._viewCache = {}
    , viewPathCache = ViewHelper._viewPathCache = {}
    , relateActionCache = ViewHelper._relateActionCache = {}
    , compiledViewCache = ViewHelper._compiledViewCache = {}
    , grammarKey = ViewHelper.grammarKey = {
        'layout': '<!--layout\\\((.\\\S*?)\\\)-->'
        , 'body': '<!--body()-->'
        , 'section': '<!--section\\\((.\\\S*?)\\\)-->'
        , 'sectionStart': '<!--sectionStart\\\((.\\\S*?)\\\)-->'
        , 'sectionEnd': '<!--sectionEnd(sectionName)-->'
    };

    ViewHelper.prototype = HelperBase();

    ViewHelper.prototype.viewEngine = function (engine) {
        if (engine) {
            this._viewEngine = engine;
        }
        return this._viewEngine;
    }

    function getGrammarKeyReg() {
        var regObj = {};
        Object.keys(ViewHelper.grammarKey).forEach(function (key, index) {
            regObj[key] = new RegExp(ViewHelper.grammarKey[key], 'gi');
        });
        return regObj;
    }

    // should be sync
    ViewHelper.prototype.render = function (viewName, options) {

        if (options == undefined) {
            options = {};
        }

        var self = this;

        var viewPath = this.lookup(viewName);

        var compiledViewFunc = ViewHelper.compiledView(this.mvc().viewEngine, viewPath);

        if (!compiledViewFunc) {
            viewPath = this.lookup(viewName, true);
            compiledViewFunc = ViewHelper.compiledView(this.mvc().viewEngine, viewPath);
        }

        if (!compiledViewFunc) {
            throw new Error('View "' + viewName + '" not found.');
        }

        var compiledView;

        try {
            compiledView = compiledViewFunc(options);
        } catch (E) {

            compiledView = viewPath + '<br/>';

            compiledView += E.message + '<br/>';

            compiledView += E.number;
        }

        if (compiledView) {
            compiledView = compiledView.replace(/^\s*|\s*$/g, '');
        }

        var regObj = getGrammarKeyReg();

        var layout = regObj.layout.exec(compiledView);

        if (layout && layout[1]) {

            compiledView = compiledView.replace(layout[0], '');

            var layoutTmpl = self.render(layout[1], options);

            var sections = {}
                , _compiledView = compiledView + ''
                , currentSection
                , _layoutTmpl = layoutTmpl + ''
                , sectionPos;

            while (currentSection = regObj.sectionStart.exec(_compiledView)) {
                var startPos = compiledView.indexOf(currentSection[0]) + currentSection[0].length;
                var sectionEndFlag = ViewHelper.grammarKey.sectionEnd.replace('sectionName', currentSection[1]);
                var endPos = compiledView.indexOf(sectionEndFlag);
                sections[currentSection[1]] = compiledView.substring(startPos, endPos);
                compiledView = compiledView.replace(sections[currentSection[1]], '');
                compiledView = compiledView.replace(currentSection[0], '');
                compiledView = compiledView.replace(sectionEndFlag, '');
            }

            while (sectionPos = regObj.section.exec(_layoutTmpl)) {
                layoutTmpl = layoutTmpl.replace(sectionPos[0], sections[sectionPos[1]] || '');
            }

            return layoutTmpl.replace(ViewHelper.grammarKey.body, compiledView);

        } else {
            return compiledView;
        }
    }

    ViewHelper.compiledView = function (viewEngine, viewPath, reCompiled) {
        var viewTmpl, compiledView;
        try {
            if (fs.existsSync(viewPath)) {
                viewTmpl = (reCompiled ? false : viewCache[viewPath]) || (viewCache[viewPath] = fs.readFileSync(viewPath, 'utf8'));
                compiledView = (reCompiled ? false : compiledViewCache[viewPath]) || (compiledViewCache[viewPath] = viewEngine.compile(viewTmpl, {}));

            } else {
                viewCache[viewPath] = null;
                compiledViewCache[viewPath] = null;
            }
        } catch (E) { }
        return compiledView;
    }

    ViewHelper.prototype.lookup = function (viewName, reLookup) {
        var area = this.routes().area
        , controller = this.routes().controller
        , action = viewName;
        return ViewHelper.lookup(this.mvc(), viewName, controller, area, reLookup);
    }

    ViewHelper.lookup = function (mvc, action, controller, area, reLookup) {
        var key = area ? path.join(area, controller, action) : path.join(controller, action)
        , paths
        , rootDir = mvc.rootDir;

        if (viewPathCache[key] && !reLookup) {
            return viewPathCache[key];
        }

        if (area) {
            paths = [
                path.join(rootDir, mvcConfig.area_dir_name, area, mvcConfig.view_dir_name, controller, getPureActionForView(action) + mvcConfig.viewExtension)
                , path.join(rootDir, mvcConfig.area_dir_name, area, mvcConfig.view_dir_name, controller, mvcConfig.share_dir_name, getPureActionForView(action) + mvcConfig.viewExtension)
                , path.join(rootDir, mvcConfig.area_dir_name, area, mvcConfig.view_dir_name, mvcConfig.share_dir_name, getPureActionForView(action) + mvcConfig.viewExtension)
                , path.join(rootDir, mvcConfig.view_dir_name, mvcConfig.share_dir_name, getPureActionForView(action) + mvcConfig.viewExtension)
            ];
        } else {
            paths = [
                path.join(rootDir, mvcConfig.view_dir_name, controller, getPureActionForView(action) + mvcConfig.viewExtension)
                , path.join(rootDir, mvcConfig.view_dir_name, controller, mvcConfig.share_dir_name, getPureActionForView(action) + mvcConfig.viewExtension)
                , path.join(rootDir, mvcConfig.view_dir_name, mvcConfig.share_dir_name, getPureActionForView(action) + mvcConfig.viewExtension)
            ];
        }

        for (var i = 0; i < paths.length; i++) {
            if (fs.existsSync(paths[i])) {
                viewPathCache[key] = paths[i];
                break;
            }
        }

        if (!viewPathCache[key]) {
            throw new Error('View "' + action + '" not found !\r\n search these paths:\r\n' + paths.join('\r\n'));
        }

        return viewPathCache[key];
    }

    ViewHelper.watchDir = function (mvc, controller, area) {
        controller = controller.replace(/\.js$/, '');

        var dir = area ?
            path.join(mvc.rootDir, mvcConfig.area_dir_name, area, mvcConfig.view_dir_name, controller)
            : path.join(mvc.rootDir, mvcConfig.view_dir_name, controller)

        , shareDir = path.join(dir, mvcConfig.share_dir_name)
        , extensionReg = new RegExp(mvcConfig.viewExtension + '$'.replace(/\./g, '\\.'));;



        function preCompileViews(dir) {
            return function (err, files) {
                if (files) {
                    files.forEach(function (filename) {
                        if (filename) {
                            fs.stat(path.join(dir, filename), function (er, stat) {
                                if (stat.isFile()) {
                                    filename = filename.replace(extensionReg, '');
                                    try {
                                        ViewHelper.lookup(mvc, filename, controller, area);
                                    } catch (E) {
                                        avril.log(path.join(dir, filename));
                                        avril.log(E);
                                    }
                                }
                            });
                        }
                    });
                }
            }
        }

        function watchDir(dir) {
            return function (event, filename) {
                if (extensionReg.test(filename)) {
                    var viewPath = path.join(dir, filename);
                    try {
                        ViewHelper.lookup(mvc, filename.replace(extensionReg, ''), controller, area);
                    } catch (E) { }
                    try {
                        ViewHelper.compiledView(mvc.viewEngine, viewPath, true);
                    } catch (E) { }
                } else {
                    preCompileViews(dir);
                }
            }
        }



        fs.exists(dir, function (exists) {
            if (exists) {
                fs.readdir(dir, preCompileViews(dir));
                fs.watch(dir, watchDir(dir));
            }
        });


        fs.exists(shareDir, function (exists) {
            if (exists) {
                fs.readdir(shareDir, preCompileViews(shareDir));
                fs.watch(shareDir, watchDir(shareDir));
            }
        });

    }

})();

//#endregion

//#region HtmlHelper

function HtmlHelper(app, req, res, routes, ctrlCfgCache, mvc) {
    if (!(this instanceof HtmlHelper)) {
        return new HtmlHelper(app, req, res, routes, ctrlCfgCache, mvc);
    }
    this.init(app, req, res, routes, ctrlCfgCache, mvc);
    this.partial = function () { }
    this.scripts = function () { }
    this.styles = function () { }
    this.actionLink = function () { }
};

HtmlHelper.prototype = HelperBase();

(function () {
    var generateScript = function (src, attrs) {
        var attrStr = '';
        for (var a in attrs) {
            attrStr += ' ' + a + '="' + attrs[a] + '" ';
        }
        return '<script type="text/javascript" language="javascript" src="' + src + '" ' + attrStr + '></script>\r\n';
    }
    , generateStyle = function (src, attrs) {
        var attrStr = '';
        if (attrs) {
            for (var a in attrs) {
                attrStr += ' ' + a + '="' + attrs[a] + '" ';
            }
        }
        return '<link href="' + src + '" type="text/css" rel="stylesheet" ' + attrStr + '/>\r\n';
    }
    , flags = {}
    , minify = require('./avril.mvc.minify.js');

    HtmlHelper.prototype.resourceScript = function (resourceName, combine, version, scriptList, attrs, minifyEx) {

        var appConfig = Mvc.appConfig.appConfig || {}
        , scriptResources = Mvc.appConfig.scriptResources || {}
        , resObj = scriptResources[resourceName] || {};

        version = version || resObj.version || appConfig.version;

        combine = (combine !== undefined ? combine : (resObj.minify != undefined ? resObj.minify : appConfig.minifyJs));

        scriptList = scriptList || resObj.items;

        attrs = attrs || resObj.attrs;

        var output = '';

        if (scriptList && (scriptList instanceof Array)) {
            if (combine) {

                var fileName = resourceName + '-' + version + (minifyEx || appConfig.minifyJsEx || '.js');

                var relativePath = '/scripts/bin/' + fileName;

                if (!flags[relativePath]) {
                    var _list = [];
                    scriptList.forEach(function (scriptPath) {
                        _list.push(path.join(avril._rootDir, 'public', scriptPath));
                    });

                    var releasePath = path.join(avril._rootDir, 'public', relativePath);

                    fs.exists(releasePath, function (exists) {
                        if (!exists) {
                            minify.minifyJs(_list, function (err, script) {
                                fs.mkdirs(path.dirname(releasePath), function () {
                                    fs.writeFile(releasePath, script, 'utf8');
                                });
                            }, appConfig.minifyJs, version, releasePath);
                        }
                    });

                    flags[relativePath] = true;
                }

                output = generateScript(relativePath, attrs);
            } else {
                scriptList.forEach(function (src) {
                    output += generateScript(src, attrs);
                });
            }
        }

        return output;
    };


    HtmlHelper.prototype.resourceStyle = function (resourceName, combine, version, styleList, attrs, minifyEx) {
        var appConfig = Mvc.appConfig.appConfig || {}
        , styleResources = Mvc.appConfig.styleResources || {}
        , resObj = styleResources[resourceName] || {};

        version = version || styleResources.version || appConfig.version;

        combine = (combine != undefined ? combine : (resObj.minify != undefined ? resObj.minify : appConfig.minifyCss));

        styleList = styleList || resObj.items;
        attrs = attrs || resObj.attrs;
        var output = '';

        if (styleList && (styleList instanceof Array)) {
            if (combine) {

                var mappedStyleList = [];

                styleList.forEach(function (src) {
                    mappedStyleList.push(path.join(avril._rootDir, 'public', src));
                });

                var fileName = resourceName + '-' + version + (minifyEx || appConfig.minifyCssEx || '.css');

                var relativePath = '/styles/bin/' + fileName;

                if (!flags[relativePath]) {
                    var releasePath = path.join(avril._rootDir, 'public', relativePath);

                    var _list = [];

                    styleList.forEach(function (scriptPath) {
                        _list.push(path.join(avril._rootDir, 'public', scriptPath));
                    });

                    var releasePath = path.join(avril._rootDir, 'public', relativePath);

                    fs.exists(releasePath, function (exists) {
                        if (!exists) {
                            fs.mkdirs(path.dirname(releasePath), function () {
                                minify.minifyCss(_list, function (err, css) {
                                    fs.writeFile(releasePath, css, 'utf8');
                                }, appConfig.minifyCss, version, releasePath);
                            });
                        }
                    });

                    flags[relativePath] = true;
                }

                output = generateStyle(relativePath, attrs);
            } else {
                styleList.forEach(function (src) {
                    output += generateStyle(src, attrs);
                });
            }
            return output;
        }
    }

    function generateAttrs(attrs) {
        var arr = [];
        Object.keys(attrs).forEach(function (key) {
            var value = attrs[key] || '';

            if (value && value.toString() == '[object Object]') {
                value = JSON.stringify(value);
            }
            if (typeof (value) == 'string' && value.indexOf('"') >= 0) {
                arr.push(key + '=\'' + value + '\'');
            } else {
                arr.push(key + '="' + value + '"');
            }
        });
        return arr.join(' ');
    }

    function generateInput(type, name, value, attrs) {
        var arr = ['<input']
        , obj = avril.extend({
            name: name
            , id: name
            , value: value || null
            , type: type
        }, attrs);

        arr.push(generateAttrs(obj));

        arr.push('/>');
        return arr.join(' ');
    }

    HtmlHelper.prototype.attrs = generateAttrs;

    HtmlHelper.prototype.input = function (name, value, attrs) {
        return generateInput('text', name, value, attrs);
    }

    HtmlHelper.prototype.textarea = function (name, value, attrs) {
        var arr = ['<textarea']
        , obj = avril.extend({
            name: name
            , id: name
        }, attrs);
        arr.push(generateAttrs(obj));
        arr.push('>');
        arr.push(value)
        arr.push('</textarea>');
        return arr.join(' ');
    }

    HtmlHelper.prototype.select = function (name, val, datasource, attrs) {
        var arr = ['<select']
        , obj = avril.extend({
            name: name
            , value: val
        }, attrs);

        arr.push(generateAttrs(obj));

        arr.push('>');


        if (datasource && datasource.length) {
            datasource.forEach(function (item) {
                var value = item, text = item;
                if (item) {
                    if (item.value) { value = item.value; }
                    text = value;
                    if (item.text) {
                        text = item.text;
                    }
                }
                arr.push('<option value="' + value + '"' + (val == value ? 'selected="selected"' : '') + '>');
                arr.push(text);
                arr.push('</option>');
            });
        }

        arr.push('</select>');
        return arr.join(' ');
    }

    HtmlHelper.prototype.checkbox = function (name, value, attrs) {
        return generateInput('checkbox', name, value, attrs);
    }

    HtmlHelper.prototype.radio = function (name, value, attrs) {
        return generateInput('radio', name, value, attrs);
    }

    HtmlHelper.prototype.editor = function (tempName, name, value, attrs) {
        var viewHelper = new ViewHelper(this.app(), this.req(), this.res(), this.routes(), this.controllerConfig(), this.mvc());
        return viewHelper.render(tempName, {
            name: name
            , value: value
            , attrs: attrs
        });
    }

    HtmlHelper.prototype.label = function (name, text, attrs) {
        if (arguments.length == 2) {
            if (text.toString() == '[object Object]') {
                attrs = text;
                text = name;
            }
        }
        var helper = new avril.mvc.Helper(this.app(), this.req(), this.res(), this.routes(), this.controllerConfig(), this.mvc());
        var arr = ['<label']
        , obj = avril.extend({
            'for': name
        }, attrs);
        arr.push(generateAttrs(obj));
        arr.push('>');
        arr.push(text.localize(helper));
        arr.push('</label>');
        return arr.join(' ');
    }

    HtmlHelper.prototype.tagBegin = function (tag, attrs) {
        if (arguments.length == 2) {
            if (text.toString() == '[object Object]') {
                attrs = text;
                text = name;
            }
        }
        var arr = ['<' + tag]
        , obj = avril.extend({
        }, attrs);
        arr.push(generateAttrs(obj));
        arr.push('>');
        return arr.join(' ');
    }

    HtmlHelper.prototype.tagEnd = function (tag) {
        return '</' + tag + '>'
    }
})();

//#endregion

//#region urlhelper

function UrlHelper(app, req, res, routes, ctrlCfgCache, mvc) {
    if (!(this instanceof UrlHelper)) {
        return new UrlHelper(app, req, res, routes, ctrlCfgCache, mvc);
    }
    this.init(app, req, res, routes, ctrlCfgCache, mvc);
}

UrlHelper.prototype = HelperBase();

UrlHelper.prototype.action = function () {
    var arg0 = arguments[0]
        , arg1 = arguments[1]
        , arg2 = arguments[2]
        , arg3 = arguments[3]
        , self = this
        , routes = (function () {
            var obj = {};
            for (var k in self.routes()) {
                obj[k] = self.routes()[k];
            }
            if (self.req().param('user_culture'))
                obj['user_culture'] = self.req().param('user_culture');
            return obj;
        })()
        , _action = routes.action
        , _controller = routes.controller
        , _area = routes.area
        , action
    ;

    switch (arguments.length) {
        case 1:
            {
                if (typeof arg0 == 'string') {
                    action = routes.action = arg0;
                } else if (typeof arg0 == 'object') {
                    avril.extend(true, routes, arg0);
                }
                break;
            }
        case 2:
            {
                routes.action = arg0;
                if (typeof arg1 == 'string') {
                    routes.controller = arg1;
                } else if (typeof arg1 == 'object') {
                    avril.extend(true, routes, arg1);
                }
                break;
            }
        case 3:
            {
                routes.action = arg0;
                routes.controller = arg1;
                if (typeof arg2 == 'string') {
                    routes.area = arg2;
                } else if (typeof arg2 == 'object') {
                    avril.extend(true, routes, arg2);
                }
                break;
            }
        case 4:
            {
                routes.action = arg0;
                routes.controller = arg1;
                routes.area = arg2;
                if (typeof arg3 == 'object') {
                    avril.extend(true, routes, arg3);
                }
                break;
            }
    }

    var res = handleRouteName(routes.action, routes.controller, routes.area);
    var shortUrl = res[res.length - 1];
    var url = res[0];
    var action = routes.action;

    var sysRouting = ['area', 'controller', 'action', ':action'];

    var routeMap = {};

    for (var key in routes) {
        if (sysRouting.indexOf(key.toLowerCase()) < 0) {
            if (url.indexOf('/:' + key) >= 0) {
                url = url.replace('/:' + key, '/' + routes[key]);
            }
            else {
                routeMap[key] = routes[key];
            }
        }
    }

    if (Object.keys(routeMap).length > 0) {
        url = url + '?' + querystring.stringify(routeMap);
    }

    if (res[0] == url) {
        url = shortUrl;
    }

    var result = {
        isCurrentPath: function () {
            return _action == routes.action
                && _area == routes.area
                && _controller == routes.controller;
        }
        , isCurrentParam: function (params) {
            var result = true;
            if (params) {
                params.split(',').forEach(function (p) {
                    if (p) {
                        result = result && (self.req().param(p) === routeMap[p]);
                    }
                });
            }
            return result;
        }
    };
    result.toString = function () { return url; }

    return result;
}

UrlHelper.prototype.param = function (key) {
    return this.req().param(key);
}

//#endregion

//#region Authorize
function Authorize(app, req, res, routes, ctrlCfgCache, mvc) {
    if (!(this instanceof Authorize)) {
        return new Authorize(app, req, res, routes, ctrlCfgCache, mvc);
    }
    this.init(app, req, res, routes, ctrlCfgCache, mvc);
}
Authorize.prototype = HelperBase();
Authorize.prototype.auth = function (next) {
    next(true);
}
//#endregion

//#region  Helper

function Helper(app, req, res, routes, ctrlCfgCache, mvc) {
    if (!(this instanceof Helper)) {
        return new Helper(app, req, res, routes, ctrlCfgCache, mvc);
    }
    this.init(app, req, res, routes, ctrlCfgCache, mvc);
    this.viewHelper = this.view = new ViewHelper(app, req, res, routes, ctrlCfgCache, mvc);
    this.urlHelper = this.url = new UrlHelper(app, req, res, routes, ctrlCfgCache, mvc);
    this.htmlHelper = this.html = new HtmlHelper(app, req, res, routes, ctrlCfgCache, mvc);
    this.authorize = new Authorize(app, req, res, routes, ctrlCfgCache, mvc);

    this.getModel = function () {
        return this.updateModel({});
    }
    this.updateModel = function (model) {
        var source = req.body || {};
        Object.keys(source).forEach(function (key) {
            avril.object.setVal(model, key, source[key]);
        });
        return model;
    }
    this.valid = function () {
        var model = this.getModel();
        return true;
    }
    this.isAjax = function () {
        return this.req().headers["x-requested-with"];
    }
}

Helper.prototype = HelperBase();

//#endregion

//#region helper base

function HelperBase(app, req, res, routes, ctrlCfgCache, mvc) {
    if (!(this instanceof HelperBase)) {
        return new HelperBase(app, req, res, routes, ctrlCfgCache, mvc);
    }
    var _app, _req, _res, _routes, _ctrlCfgCache, _mvc;
    this.app = function () { return _app; };
    this.req = function () { return _req; }
    this.res = function () { return _res; }
    this._routes = routes;
    this.routes = function () { return _routes; }
    this.controllerConfig = function () { return _ctrlCfgCache; }
    this.mvc = function () {
        return _mvc;
    }

    this.init = function (app, req, res, routes, ctrlCfgCache, mvc) {
        _app = app;
        _req = req;
        _res = res;
        _routes = routes;
        _ctrlCfgCache = ctrlCfgCache;
        _mvc = mvc;
        this.avril = avril;
        return this;
    };
}

//#endregion

//#region exports

module.exports = Mvc();

module.exports.config = mvcConfig;
module.exports.HtmlHelper = HtmlHelper;
module.exports.UrlHelper = UrlHelper;
module.exports.ViewHelper = ViewHelper;
module.exports.Helper = Helper;
module.exports.HelperBase = HelperBase;
module.exports.Authorize = Authorize;
module.exports.Mvc = Mvc;

//#endregion


//#endregion

