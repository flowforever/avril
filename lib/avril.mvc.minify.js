var avril = require('avril')
, path = require('path')
, fs = require('fs');

//#region jscex extension
var Jscex = require("jscex");
require("jscex-jit").init(Jscex);
require("jscex-async").init(Jscex);
require("jscex-async-powerpack").init(Jscex);

path.existsAsync = Jscex.Async.Jscexify.fromCallback(path.exists);
fs.readFileAsync = Jscex.Async.Jscexify.fromStandard(fs.readFile);

//#endregion

var parser = require("uglify-js").parser;
var uglify = require("uglify-js").uglify;

var _cache = {}, _fileCache = {};

module.exports = {
    minifyJs: function (jsList, callback, compress, version, cache) {
        if (!(jsList instanceof Array)) {
            throw new Error('Invalide list .');
        }
        compress = compress !== false;
        var key = jsList.join(';') + '?v=' + version;

        if (_cache[key]) {
            callback(null, _cache[key]);
        } else {
            eval(Jscex.compile("async", function () {
                var result = '';
                for (var i = 0; i < jsList.length ; i++) {
                    var file = jsList[i];
                    var filePath = path.join(avril._rootDir, 'public', file);
                    if (_fileCache[filePath]) {
                        result += ';' + _fileCache[filePath];
                    } else {
                        var exists = $await(path.existsAsync(filePath));
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
};
