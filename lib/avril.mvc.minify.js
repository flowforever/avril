var avril = require('avril')
, path = require('path')
, fs = require('fs');

var cleanCSS = require('clean-css');

//#region jscex extension
var Jscex = require("jscex");
require("jscex-jit").init(Jscex);
require("jscex-async").init(Jscex);
require("jscex-async-powerpack").init(Jscex);

fs.existsAsync = Jscex.Async.Jscexify.fromCallback(fs.exists);
fs.readFileAsync = Jscex.Async.Jscexify.fromStandard(fs.readFile);

//#endregion

var parser = require("uglify-js").parser;
var uglify = require("uglify-js").uglify;

var _cache = {}, _fileCache = {};

module.exports = {
    minifyJs: function (jsList, callback, compress, version, cache) {
        if (!(jsList instanceof Array)) {
            callback('jsList should be array of string.', null);
        } else {
            compress = compress !== false;
            var key = jsList.join(';') + '?v=' + version;

            if (_cache[key]) {
                callback(null, _cache[key]);
            } else {
                eval(Jscex.compile("async", function () {
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
    , minifyCss: function (cssList, callback, compress, version, cache) {
        if (!(cssList instanceof Array)) {
            callback('css should be array of string.', null);
        } else {
            compress = compress !== false;
            var key = cssList.join(';') + '?v=' + version;

            if (_cache[key]) {
                callback(null, _cache[key]);
            } else {
                eval(Jscex.compile("async", function () {

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
