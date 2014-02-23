var mongoose = require('mongoose'),

connection,

utils = require('./avril').utils,

Schema = mongoose.Schema,

ObjectId = Schema.ObjectId,

Context = {

    init: function (conn) {
        connection = conn || connection;
        mongoose.connect(connection, function (err) {
            if (err) throw err;
        });

        return this;
    },

    model: function (name) {
        return this[name];
    },

    _schema: {},

    schema: function (name, schema) {
        if (name && schema) {
            this._schema[name] = schema;
        } else if (name) {
            return this._schema[name];
        }
        return this._schema;
    }

    , pagingQuery: function (query, func) {
        query.length(function (err, length) {

        });
    }
},

getType = function (name) {
    return Context[name];
},

onModelDefinedMap = {},

registerModelDefined = function (name, func) {
    if (Context[name]) {
        func(Context.schema(name));
    } else {
        if (!onModelDefinedMap[name]) {
            onModelDefinedMap[name] = [];
        }
        onModelDefinedMap[name].push(func);
    }
},

triggerModelDefined = function (name, schema) {

    if (onModelDefinedMap[name]) {
        for (var i = 0; i < onModelDefinedMap[name].length; i++) {
            var func = onModelDefinedMap[name][i];
            if (!func.executed) {
                func(schema || Context.schema(name));
            }
            func.executed = true;
        }
    }
}

;

require('mongoose-pagination');

Context.mongoose = mongoose;

Context.define = function (name, schemadefine, statics, methods) {

    if (name && schemadefine) {

        var model = new Schema(schemadefine),

        keys = Object.keys(schemadefine),

        refReg = /\S+_id$/gi,

        staticMethods = {
            all: function (func) {
                return Context[name].find(func);
            }
            , add: function (obj, func) {
                var type = getType(name);
                if (obj instanceof type) {
                    obj.save();
                } else {
                    var model = new type();
                    Object.keys(obj).forEach(function (key) {
                        model[key] = obj[key];
                    });
                    model.save(func || function () { });
                }
            }
            , get: function (obj, fun) {
                Context.model(name).findOne(obj, func)
            }
        },

        typeMethods = {
            update: function (obj, callback) {

            }
        };

        /* register ref methods */
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];

            if (refReg.test(key)) {

                var tableName = key.replace(/_id$/gi, ''),

                typeName = tableName.charAt(0).toUpperCase()
                            + (tableName.length > 1 ? tableName.substring(1) : ''),

                modelName = typeName + 's';

                registerModelDefined(modelName, function (schema) {
                    typeMethods['get' + typeName] = function () {
                        var id = this[key];
                        return Context.model(modelName).findOne({
                            'id': id
                        });
                    }
                    schema.methods['get' + name] = function () {
                        return Context.model(name).where(key, this.id);
                    }
                });

            }
        }

        utils.merge(model.methods, typeMethods);

        utils.merge(model.statics, staticMethods);

        if (methods) {
            utils.merge(model.methods, methods);
        }

        if (statics) {
            utils.merge(model.statics, statics);
        }

        mongoose.model(name, model);

        Context[name] = mongoose.model(name);

        Context.schema(name, model);

        triggerModelDefined(name, model);

    }

    return Context.define;
};

Context.valid = function (validMeta) {

    var validList = []

        , api = {
            mg: function (name) {
                return [
                    function (value) {
                        return valid(value);
                    }
                , name + ':' + validMeta];
            }
        }

        , add = function (validName, func) {
            this[validName] = function () {
                validList.push({
                    name: validName,
                    valid: func,
                    args: arguments
                });
                return this;
            }
        }

        , valid = function (value) {
            var result = true;
            validList.forEach(function (v, index) {
                v.args.unshift(value);
                if ((result = v.valid.apply(null, v.args)) == false) {
                    return false;
                }
            });
            return result;
        }

        , _getMethod = function (callingStr) {
            var reg = /(\((\w*,*)*\))/;
            var methodName = callingStr.replace(reg, '');
            var argExec = reg.exec(callingStr);
            var args = [];
            if (argExec && argExec.length) {
                var argStr = argExec[0];
                argStr = argStr.substring(1, argStr.length - 1);
                argStr.split(',').forEach(function (param) {
                    args.push(param);
                });
            }
            return {
                name: methodName
                , args: args
            };
        };

    Object.keys(Context.valid.methods).forEach(function (key) {
        add.call(api, key, Context.valid.methods[key]);
    });

    if (typeof validMeta == 'string') {
        validMeta.split(' ').forEach(function (method, index) {
            var mObj = _getMethod(method);
            if (api[mObj.name]) {
                api[mObj.name].apply(api, mObj.args);
            }
        });
    }


    return api;
};

Context.valid.methods = {

    // http://docs.jquery.com/Plugins/Validation/Methods/required
    required: function (value, param) {
        return value != null && value != '';
    },


    // http://docs.jquery.com/Plugins/Validation/Methods/minlength
    minlength: function (value, param) {
        return value.trim().length >= param;
    },

    // http://docs.jquery.com/Plugins/Validation/Methods/maxlength
    maxlength: function (value, param) {
        return value.trim().length <= param;
    },

    // http://docs.jquery.com/Plugins/Validation/Methods/rangelength
    rangelength: function (value, param) {
        var length = value.trim().length;
        return (length >= param[0] && length <= param[1]);
    },

    // http://docs.jquery.com/Plugins/Validation/Methods/min
    min: function (value, param) {
        return value >= param;
    },

    // http://docs.jquery.com/Plugins/Validation/Methods/max
    max: function (value, param) {
        return value <= param;
    },

    // http://docs.jquery.com/Plugins/Validation/Methods/range
    range: function (value, param1, param2) {
        return (value >= param1 && value <= param2);
    },

    // http://docs.jquery.com/Plugins/Validation/Methods/email
    email: function (value) {
        // contributed by Scott Gonzalez: http://projects.scottsplayground.com/email_address_validation/
        return /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(value);
    },

    // http://docs.jquery.com/Plugins/Validation/Methods/url
    url: function (value) {
        // contributed by Scott Gonzalez: http://projects.scottsplayground.com/iri/
        return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
    },

    // http://docs.jquery.com/Plugins/Validation/Methods/date
    date: function (value) {
        return !/Invalid|NaN/.test(new Date(value));
    },

    // http://docs.jquery.com/Plugins/Validation/Methods/dateISO
    dateISO: function (value) {
        return /^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}$/.test(value);
    },

    // http://docs.jquery.com/Plugins/Validation/Methods/number
    number: function (value) {
        return /^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(value);
    },

    // http://docs.jquery.com/Plugins/Validation/Methods/digits
    digits: function (value, element) {
        return /^\d+$/.test(value);
    },

    // http://docs.jquery.com/Plugins/Validation/Methods/creditcard
    // based on http://en.wikipedia.org/wiki/Luhn
    creditcard: function (value) {
        // accept only spaces, digits and dashes
        if (/[^0-9 -]+/.test(value))
            return false;
        var nCheck = 0,
				nDigit = 0,
				bEven = false;

        value = value.replace(/\D/g, "");

        for (var n = value.length - 1; n >= 0; n--) {
            var cDigit = value.charAt(n);
            var nDigit = parseInt(cDigit, 10);
            if (bEven) {
                if ((nDigit *= 2) > 9)
                    nDigit -= 9;
            }
            nCheck += nDigit;
            bEven = !bEven;
        }

        return (nCheck % 10) == 0;
    },

    // http://docs.jquery.com/Plugins/Validation/Methods/accept
    accept: function (value, param) {
        param = typeof param == "string" ? param.replace(/,/g, '|') : "png|jpe?g|gif";
        return value.match(new RegExp(".(" + param + ")$", "i"));
    }

};

module.exports = Context;