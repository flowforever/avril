var path = require('path')
    , fs = require('fs')
    , avril = require('avril')
    , appConfig = avril.getConfig('app')
    , scriptResources = avril.getConfig('scriptResources')
    , styleResources = avril.getConfig('styleResources')
    , minify = avril.mvc.minify
    , generateScript = function (src, attrs) {
        var attrStr = '';
        for (var a in attrs) {
            attrStr += ' ' + a + '="' + attrs[a] + '" ';
        }
        return '<script type="text/javascript" language="javascript" src="' + src + '" ' + attrStr + '></script>';
    }
    , generateStyle = function (src, attrs) {
        var attrStr = '';
        for (var a in attrs) {
            attrStr += ' ' + a + '="' + attrs[a] + '" ';
        }
        return '<link href="' + src + '" type="text/css" rel="stylesheet" ' + src + '" ' + attrStr + '/>';
    }
    , compressor = require('node-minify')
    , flags = {};

var resourceScript =
    avril.mvc.HtmlHelper.prototype.resourceScript =
    function (resourceName, combine, version, scriptList, attrs) {
        version = version || appConfig.version;
        combine = (combine != undefined ? combine : appConfig.combine);
        var resObj = scriptResources[resourceName] || {};
        scriptList = scriptList || resObj.items;
        attrs = attrs || resObj.attrs;
        var output = '';

        if (scriptList && (scriptList instanceof Array)) {
            if (combine) {
                var fileName = resourceName + '-' + version + '.js';

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
                                fs.writeFile(releasePath, script, 'utf8');
                            }, appConfig.minifyJs, version);
                        }
                    });

                    flags[relativePath] = true;
                }

                output = generateScript(relativePath);
            } else {
                scriptList.forEach(function (src) {
                    output += generateScript(src, attrs);
                });
            }
        }
        return output;
    };

var resourceStyle = avril.mvc.HtmlHelper.prototype.resourceStyle = function (resourceName, combine, version, styleList, attrs) {
    version = version || appConfig.version;
    combine = (combine != undefined ? combine : appConfig.combine);
    var resObj = styleResources[resourceName] || {};
    styleList = styleList || resObj.items;
    attrs = attrs || resObj.attrs;
    var output = '';

    if (styleList && (styleList instanceof Array)) {
        if (combine) {

            var mappedStyleList = [];

            styleList.forEach(function (src) {
                mappedStyleList.push(path.join(avril._rootDir, 'public', src));
            });

            var fileName = resourceName + '-' + version + '.css';

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
                        minify.minifyCss(_list, function (err, css) {
                            fs.writeFile(releasePath, css, 'utf8');
                        }, appConfig.minifyCss, version);
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

Object.keys(scriptResources).forEach(function (key) {
    resourceScript(key);
});

Object.keys(styleResources).forEach(function (key) {
    resourceStyle(key);
})

String.prototype.real = function (helper) {
    return helper.view.lookup(this.toString());
}