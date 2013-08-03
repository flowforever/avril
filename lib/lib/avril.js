var path = require('path')
, fs = require('fs');
/**
* Module avril framework.
*/

var avril = {

    initRootDir: function (dir, options) {
        var root = this._rootDir = dir || this._rootDir;
        fs.readdir(path.join(root, 'inits'), function (err, docs) {
            if (!err) {
                docs.forEach(function (file) {
                    require(path.join(root, 'inits', file));
                });
            }

        });
        return this;
    }

    , type: function (obj) {
        return typeof (obj);
    }

    , isFunction: function (obj) {
        return typeof (obj) === 'function';
    }

    , isArray: function (obj) {
        return obj instanceof Array;
    }

    , isPlainObject: function (obj) {

        if (!obj || avril.type(obj) !== "object") {
            return false;
        }

        var hasOwn = Object.prototype.hasOwnProperty;

        try {
            // Not own constructor property must be Object
            if (obj.constructor &&
				!hasOwn.call(obj, "constructor") &&
				!hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
                return false;
            }
        } catch (e) {
            // IE8,9 Will throw exceptions on certain host objects #9897
            return false;
        }

        // Own properties are enumerated firstly, so to speed up,
        // if last one is own, then all properties are own.

        var key;
        for (key in obj) { }

        return key === undefined || hasOwn.call(obj, key);
    }

    , extend: function () {
        var options, name, src, copy, copyIsArray, clone,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false;

        // Handle a deep copy situation
        if (typeof target === "boolean") {
            deep = target;
            target = arguments[1] || {};
            // skip the boolean and the target
            i = 2;
        }

        // Handle case when target is a string or something (possible in deep copy)
        if (typeof target !== "object" && !avril.isFunction(target)) {
            target = {};
        }

        // extend avril itself if only one argument is passed
        if (length === i) {
            target = this;
            --i;
        }

        for (; i < length; i++) {
            // Only deal with non-null/undefined values
            if ((options = arguments[i]) != null) {
                // Extend the base object
                for (name in options) {
                    src = target[name];
                    copy = options[name];

                    // Prevent never-ending loop
                    if (target === copy) {
                        continue;
                    }

                    // Recurse if we're merging plain objects or arrays
                    if (deep && copy && (avril.isPlainObject(copy) || (copyIsArray = avril.isArray(copy)))) {
                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && avril.isArray(src) ? src : [];

                        } else {
                            clone = src && avril.isPlainObject(src) ? src : {};
                        }

                        // Never move original objects, clone them
                        target[name] = avril.extend(deep, clone, copy);

                        // Don't bring in undefined values
                    } else if (copy !== undefined) {
                        target[name] = copy;
                    }
                }
            }
        }

        // Return the modified object
        return target;
    }

    , url: {
        join: function () {
            if (arguments.length) {
                var arr = [];
                for (var i = 0; i < arguments.length; i++) {
                    arr.push(arguments[i]);
                }
                return arr.join('/').replace(new RegExp('//', 'g'), '');
            }
            return '';
        }
    }

    , _rootDir: __dirname

    , require: function (ns) {
        var _path;
        if (ns.indexOf('/') >= 0) {
            _path = path.normalize(path.join(this._rootDir, ns));
        } else {
            _path = path.normalize(path.join(this._rootDir, ns.split('.').join('/')));
        }
        return require(_path);
    }

    , getConfig: function (name) {
        var cache = this.configs = {};
        var configPath = path.join(avril._rootDir, 'configs', name + '.json');
        var productionCfgPath = path.join(avril._rootDir, 'configs', name + '.production.json');
        if (!cache[name]) {
            try {

                var json = fs.readFileSync(configPath, 'utf8');

                cache[name] = eval('(' + json + ')');

                try {
                    var productionJSON = fs.readFileSync(productionCfgPath, 'utf8');
                    avril.extend(true, cache[name], eval('(' + productionJSON + ')'));
                } catch (E) { avril.log(E.message); }
            } catch (E) {
                avril.log(E);
                cache[name] = {};
            }
            cache[name].save = function (func) {
                f.writeFile(configPath, JSON.stringify(this), 'utf8');
                if (func) {
                    func(this);
                }
            }
        }

        return cache[name];
    }

    , appConfig: function () {
        return this.getConfig('../config');
    }

    , guid: function () {
        return (new Date().getTime()) + '_' + Math.random().toString().replace('.', '_');
    }

    , utils: {
        merge: function (dest, source) {
            var keys = Object.keys(source),
        i = keys.length,
        key;

            while (i--) {
                key = keys[i];
                if ('object' === typeof (source[key])
            && 'object' === typeof (dest[key])
            && !(dest[key] instanceof Array)) {
                    utils.merge(dest[key], source[key]);
                } else {
                    dest[key] = source[key];
                }
            }
            return dest;
        },
        stringEquals: function (str1, str2, ignoreCase) {
            ignoreCase = ignoreCase == undefined ? false : ignoreCase;
            if (ignoreCase) {
                return str1.toString().toLowerCase() == str2.toString().toLowerCase();
            }
            return str1.toString() == str2.toString();
        }
    }

    , log: function (text) {
        try {
            text = '--------------------------------------           ' + new Date() + '             --------------------------------------------\n' + typeof (text) == 'string' ? text : (text.message || JSON.stringify(text)) + '\n\n';

            this.logDir = 'logs';
            var date = new Date();
            var logDir = path.join(this._rootDir, this.logDir, date.getFullYear().toString() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + '-' + date.getHours() + '-' + date.getMinutes() + '.ylog');

            fs.exists(logDir, function (exists) {
                if (exists) {
                    fs.readFile(logDir, 'utf8', function (err, file) {
                        fs.writeFile(logDir, file + text, 'utf8');
                    });
                }
                else {
                    fs.writeFile(logDir, text, 'utf8');
                }
            });
        } catch (E) {
            console.log(E);
        }
    }

    , initComponent: function (name, options) {

        var obj = avril;

        name.split('.').forEach(function (k) {
            obj = obj[k];
        });

        if (obj && avril.isFunction(obj.init)) {
            obj.init(avril, options);
        }
        return this;
    }

    , callback: function (callback) {
        return function () {
            if (callback) {
                return callback.apply(this, arguments);
            } else { }
        }
    }

};

avril.object = {
    maxDeep: 10,
    getVal: function (obj, pStr) {
        if (pStr.indexOf('.') > 0) {
            var firstProp = pStr.substring(0, pStr.indexOf("."));

            var lastProp = pStr.substring(pStr.indexOf('.') + 1);
            if (firstProp.indexOf('[') >= 0) {
                var index = firstProp.substring(firstProp.indexOf('[') + 1, firstProp.lastIndexOf(']'));
                index = parseInt(index);
                if (firstProp.indexOf('[') == 0) {
                    return this.getVal(obj[index], lastProp);
                } else if (firstProp.indexOf('[') > 0) {
                    var propertyName = pStr.substring(0, pStr.indexOf('['));
                    if (propertyName.indexOf('"') == 0) {
                        propertyName = propertyName.substring(1, propertyName.length - 2);
                    }
                    return this.getVal(obj[propertyName][index], lastProp);
                }
            } else {
                var pObj = obj[firstProp];
                return this.getVal(pObj, lastProp);
            }
        } else {
            if (pStr.indexOf('[') >= 0) {
                var index = pStr.substring(pStr.indexOf('[') + 1, pStr.lastIndexOf(']'));
                index = parseInt(index);
                if (pStr.indexOf('[') == 0) {
                    return obj[index];
                } else if (pStr.indexOf('[') > 0) {
                    var propertyName = pStr.substring(0, pStr.indexOf('['));
                    return obj[propertyName][index];
                }
            } else {
                return obj[pStr];
            }
        }
    },
    setVal: function (obj, pStr, val) {
        //debugger;
        //pStr = pStr.trim();
        if (pStr.indexOf('.') > 0) {
            var firstProp = pStr.substring(0, pStr.indexOf("."));

            var lastProp = pStr.substring(pStr.indexOf('.') + 1);

            if (firstProp.indexOf('[') >= 0) {
                var index = firstProp.substring(firstProp.indexOf('[') + 1, firstProp.indexOf(']'));
                index = parseInt(index);

                if (firstProp.indexOf('[') == 0) {
                    if (!obj[index]) { obj[index] = {}; };
                    this.setVal(obj[index], lastProp, val);
                } else if (firstProp.indexOf('[') > 0) {
                    var propertyName = pStr.substring(0, pStr.indexOf('['));

                    if (!obj[propertyName]) { obj[propertyName] = []; };

                    if (!obj[propertyName][index]) { obj[propertyName][index] = {}; };

                    this.setVal(obj[propertyName][index], lastProp, val);
                }
            } else {
                if (!obj[firstProp]) {
                    obj[firstProp] = {};
                }
                this.setVal(obj[firstProp], lastProp, val);
            }


        } else {
            var arrayReg = /\[\d*\]/;
            if (arrayReg.test(pStr)) {


                var index = pStr.substring(pStr.indexOf('[') + 1, pStr.lastIndexOf(']'));

                index = parseInt(index);
                if (pStr.indexOf('[') == 0) {
                    obj[index] = val;
                } else if (pStr.indexOf('[') > 0) {
                    var propertyName = pStr.substring(0, pStr.indexOf('['));
                    if (!obj[propertyName]) {
                        obj[propertyName] = [];
                    }
                    obj[propertyName][index] = val;
                }
            } else {
                obj[pStr] = val;
            }

        }
        return obj;
    },
    beautifyNames: function (obj, deep, changeName) {
        var self = this;
        if (kooboo.isArray(obj)) {
            var r = [];
            for (var i = 0; i < obj.length; i++) {

                var val = obj[i];
                if (kooboo.isObj(val) || kooboo.isArray(val)) {
                    val = self.beautifyNames(val, deep + 1, changeName);
                }
                r.push(val);
            }
            return r;
        } else if (kooboo.isObj(obj)) {
            var result = {};
            deep = deep == undefined || isNaN(deep) ? 0 : deep;
            if (deep > this.maxDeep) {
                return result;
            }
            if (changeName == undefined) {
                changeName = true;
            }
            this.each(obj, function (key, value) {
                if (!kooboo.isObj(value)) {
                    if (kooboo.isStr(key) && changeName) {
                        result[key.lowerChar0()] = value;
                    } else {
                        result[key] = value;
                    }
                } else { // value is object
                    if (kooboo.isStr(key) && changeName) {
                        result[key.lowerChar0()] = kooboo.object.beautifyNames(value, deep + 1, changeName);
                    } else {
                        result[key] = kooboo.object.beautifyNames(value, deep + 1, changeName);
                    }
                }
            });
            return result;
        }
    },
    deepClone: function (obj) {
        return this.beautifyNames(obj, undefined, false);
    },
    each: function (obj, func) {
        if (!kooboo.isFunc(func)) {
            return false;
        }
        if (kooboo.isArray(obj)) {
            for (var i = 0; i < obj.length; i++) {
                if (func(i, obj[i]) == false) return false;
            }
        } else {
            for (var key in obj) {
                if (func(key, obj[key]) == false) return false;
            }
        }

    },
    keys: function (obj) {
        var keys = [];
        this.each(obj, function (key, value) { keys.push(key); });
        return keys;
    },
    values: function (obj) {
        var values = [];
        this.each(obj, function (key, value) { values.push(value); });
        return values;
    },
    tryGetVal: function (obj, pStr) {
        var val = undefined;
        try {
            this.getVal(obj, pStr);
        } catch (E) {

        }
        return val;
    },
    instanceOf: function (obj, type) {
        return obj instanceof type;
    },
    toArray: function (args) {
        var arr = [];
        for (var i = 0 ; i < args.length; i++) {
            arr.push(args[i]);
        }
        return arr;
    },
    sub: function (self, props) {
        if (props && typeof (props) == 'string') {
            var obj = {};
            props.split(',').forEach(function (key, index) {
                obj[key] = self[key];
            });
            return obj;
        }
        return self;
    }
};

module.exports = avril;
