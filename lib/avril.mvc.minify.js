var avril = require('avril')
, path = require('path')
, fs = require('fs-extra');

var cleanCSS = require('clean-css');

//#region Wind extension
var Wind = require("wind");
// turn off Wind's log
Wind.logger.level = Wind.Logging.Level.OFF;

fs.existsAsync = Wind.Async.Binding.fromCallback(fs.exists);
fs.readFileAsync = Wind.Async.Binding.fromStandard(fs.readFile);

//#endregion

var parser = require("uglify-js").parser;
var uglify = require("uglify-js").uglify;

var _cache = {}, _fileCache = {}, _imgReadCache = {};

function copyAndRewriteCssResources(cssFile, sourcePath, destPath) {

    var fileNameArr = sourcePath.replace(/\\/gi, '/').split('/');

    var folderName = fileNameArr[fileNameArr.length - 2];

    var resourcesFolder = "resources";

    var execReg = /url\s*\(\"*(\S+)\"*\)/gi;
    var exec = execReg.exec(cssFile);
    while (exec) {
        (function () {
            var imgPath = exec[1];

            var imgNameArr = imgPath.replace(/\"|\'/g, '').split('/');

            var imgName = imgNameArr[imgNameArr.length - 1];

            cssFile = cssFile.replace(exec[0], 'url(' + resourcesFolder + '/' + folderName + '/' + imgName + ')');

            var imgFile = path.resolve(path.dirname(sourcePath), imgPath).replace(/\"|\'/g, '');



            (!_imgReadCache[imgFile]) && fs.exists(imgFile, function (exist) {
                if (exist) {
                    var destFileName = path.resolve(path.dirname(destPath), resourcesFolder, folderName, imgName);

                    fs.mkdirs(path.dirname(destFileName), function (err) {

                        fs.copy(imgFile, destFileName, function (err) {

                        });

                    });

                }
            }) && (_imgReadCache[imgFile] = true);

        })();
        exec = execReg.exec(cssFile)
    }
    return cssFile;
}

module.exports = {
    minifyJs: function (jsList, callback, compress, version, ouptPath) {
        if (!(jsList instanceof Array)) {
            callback('jsList should be array of string.', null);
        } else {
            compress = compress !== false;
            var key = jsList.join(';') + '?v=' + version;

            if (_cache[key]) {
                callback(null, _cache[key]);
            } else {
                eval(Wind.compile("async", function () {
                    var result = '';
                    for (var i = 0; i < jsList.length ; i++) {
                        var file = jsList[i];
                        var filePath = file;
                        if (_fileCache[filePath]) {
                            result += ';' + _fileCache[filePath];
                        } else {
                            var exists = $await(fs.existsAsync(filePath));
                            if (exists) {
                                var jsFile = $await(fs.readFileAsync(filePath, 'utf8'));

                                _fileCache[filePath] = jsFile;
                                if (compress) {
                                    var ast = parser.parse(jsFile); // parse code and get the initial AST
                                    ast = uglify.ast_mangle(ast); // get a new AST with mangled names
                                    ast = uglify.ast_squeeze(ast); // get an AST with compression optimizations
                                    _fileCache[filePath] = jsFile = uglify.gen_code(ast); // compressed code here
                                }
                                result += ';' + jsFile;
                            }
                        }

                    }

                    var output = '/' + '*version=' + version + ';compress date :' + new Date().toGMTString() + '*' + '/' + result;

                    _cache[key] = output;

                    callback(null, output);

                }))().start();
            }
        }
    }
    , minifyCss: function (cssList, callback, compress, version, outPath) {
        if (!(cssList instanceof Array)) {
            callback('css should be array of string.', null);
        } else {
            compress = compress !== false;
            var key = cssList.join(';') + '?v=' + version;

            if (_cache[key]) {
                callback(null, _cache[key]);
            } else {
                eval(Wind.compile("async", function () {

                    var result = '';

                    for (var i = 0; i < cssList.length ; i++) {
                        var filePath = cssList[i], spliterArr = filePath.split(/\\|\//g), fileName = spliterArr[spliterArr.length - 1];
                        result += '\r\n';
                        var r = Math.random() + '';
                        result += '/' + '*' + fileName + '*' + '/';
                        result += '\r\n';
                        if (_fileCache[filePath]) {
                            result += _fileCache[filePath];
                        } else {
                            var exists = $await(fs.existsAsync(filePath));
                            if (exists) {
                                var cssFile = $await(fs.readFileAsync(filePath, 'utf8'));

                                cssFile = copyAndRewriteCssResources(cssFile, filePath, outPath);

                                _fileCache[filePath] = cssFile;
                                if (compress) {
                                    _fileCache[filePath] = cssFile = cleanCSS.process(cssFile);
                                }
                                result += cssFile;
                            }
                        }
                    }

                    var output = '/' + '*version=' + version + ';compress date :' + new Date().toGMTString() + '*' + '/' + result;

                    _cache[key] = output;

                    callback(null, output);

                }))().start();
            }
        }
    }
};
