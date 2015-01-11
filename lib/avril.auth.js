var avril = require('./avril')
    , avCache = require('./avril.cache')
    , _cacheKey = avCache.cacheKey
    , guid = function () {
        return new Date().getTime() + '-' + Math.random().toString().replace('.', '') + Math.random().toString().replace('.', '');
    }
    , jshashes = require('jshashes')
    , MD5 = new jshashes.MD5()
    , sysCookies = 'connectId,userStatus'.split(',')
    , config = {
        cacheExpire: 60 * 15
    };

var userStatus = (function () {
    var self = {}, _cache = {};
    'online,offline'.split(',')
    .forEach(function (status) {
        self[status] = function (connectId) {
            if (!_cache[status + connectId]) {
                _cache[status + connectId] = MD5.hex(status + connectId);
            }
            return _cache[status + connectId];
        }
    });
    return self;
})();

var _connectIdUserIdCache = {};

function WebAuth() {
    if (!(this instanceof WebAuth)) {
        return new WebAuth();
    }

    var self = this;

    avril.extend(this, {

        init: function (options) {

            avril.extend(this, options);

            sysCookies.forEach(this.addSysCookie);

            return this;
        }

        , onUnAuthorize: function (req, res, next, helper) {
            return res.send('unAuthorize');
        }

        , addSysCookie: function (key) {
            var func = self.cookies[key] = function (req, res, value) {
                var funKey = key + self.name;
                var hashKey = MD5.hex(funKey.toLowerCase()), upperKey = MD5.hex(funKey.toUpperCase());
                if (arguments.length == 3) {
                    return self.cookie(req, res).set(hashKey, value);
                } else if (arguments.length == 2) {
                    var result = self.cookie(req, res).get(hashKey);
                    if (!result || result == 'undefined') {
                        result = self.cookie(req, res).set(hashKey, upperKey + guid());
                    }
                    return result;
                }
            };
            func.remove = function (req, res) {
                var funKey = key + self.name;
                var hashKey = MD5.hex(funKey.toLowerCase());
                self.cookie(req, res).clear(hashKey);
            }
        }

        , login: function () {
            if (arguments.length == 3) {
                var cacheKey = arguments[0], user = arguments[1], next = arguments[2];
                this.updateCacheUser(cacheKey, function (_user) {

                    avril.extend(true, _user, user);

                    _user.isLogin = true;

                    return _user;
                });
            }
            else if (arguments.length == 4) {
                var req = arguments[0], res = arguments[1], user = arguments[2], next = arguments[3];
                var self = this
                , connectId = this.connectId(req, res)
                , connectIdKey = _cacheKey.connectId(connectId);

                self.cookies.userStatus(req, res, userStatus.online(connectId));

                user.id = user.id || user._id;

                this.updateCacheUser(_cacheKey.user(user.id), function (_user) {

                    avril.extend(true, _user, user);

                    if (!_user.connectIds) { _user.connectIds = []; }

                    _user.connectIds.push(connectId);

                    self.updateConnectUser(connectId, function (usr) {
                        usr.id = user.id || user._id;
                        usr.isLogin = true;
                        next();
                    });

                    return _user;
                });
            }

        }

        , logout: function () {
            if (arguments.length == 2) {
                var cacheKey = arguments[0], callback = arguments[1];
                this.removeCacheUser(cacheKey, callback);
            }
            else if (arguments.length == 3) {
                var req = arguments[0], res = arguments[1], callback = arguments[2];

                callback = avril.callback(callback);

                var connectId = this.connectId(req, res);

                this.connectUser(req, res, function (cnnUser) {
                    self.removeConnectUser(connectId);

                    self.cookies.connectId.remove(req, res);

                    self.cookies.userStatus(req, res, userStatus.offline(connectId));

                    cnnUser.userInfo && self.updateCacheUser(_cacheKey.user(cnnUser.userInfo.id), function (user) {
                        !user.connectIds && (user.connectIds = []);
                        user.connectIds.splice(user.connectIds.indexOf(connectId), 1);
                    });

                    callback();
                });
            }
        }

        , isAuth: function () {
            /*todo : compare user agent */
            if (arguments.length == 2) {
                var cacheKey = arguments[0], next = arguments[1];
                this.getCacheUser(cacheKey, function (user) {
                    next(user);
                });

            } else if (arguments.length == 3) {
                var req = arguments[0]
                    , res = arguments[1]
                    , next = arguments[2];

                var connectId = this.connectId(req, res);
                var isLogin = this.cookies.userStatus(req, res) == userStatus.online( this.connectId(req, res) ) ;
                if(!isLogin){
                    return next({});
                }

                this.getConnectUser(connectId, function (user) {
                    next(user);
                });
            }
        }

        , getCacheUser: function (cacheKey, callback) {
            cacheKey = _cacheKey.user.toValid(cacheKey);

            var self = this;

            avCache.get(cacheKey, function (err, user) {
                try {
                    user = user ? JSON.parse(user) : null;
                } catch (E) { user = null; }
                handleUser(user, callback);
            });

            function handleUser(user, callback, isNew) {
                if (user && user._id) {
                    /*find from mem*/
                    if (!user.connectIds) {
                        user.connectIds = [];
                    }
                    //user = JSON.parse(user);
                    if (isNew) {
                        avCache.set(key, JSON.stringify(user));
                    }
                    callback(user);
                } else {
                    callback(null);
                }
            }
        }
        , updateCacheUser: function (cacheKey, callback, timeout) {
            cacheKey = _cacheKey.user.toValid(cacheKey);
            this.getCacheUser(cacheKey, function (user) {
                user = user || {};
                var org = JSON.stringify(user);
                callback(user);
                var newJson = JSON.stringify(user);
                if (org != newJson) {
                    avCache.set(cacheKey, newJson);
                }
                if (timeout) {
                    avCache.expire(cacheKey, timeout);
                }
            });
        }
        , removeCacheUser: function (cacheKey, callback) {
            cacheKey = _cacheKey.user.toValid(cacheKey);
            avCache.del(cacheKey, function () {
                callback();
            });
        }

        , expire: function (key, timeout) {
            avCache.expire(key, timeout);
        }

        , isConnectId: function (cnnId) {
            return cnnId && cnnId.indexOf(MD5.hex(sysCookies[0].toUpperCase())) == 0;
        }
        , connectId: function (req, res, val) {
            return this.cookies.connectId.apply(this.cookies, arguments);
        }
        , connectUser: function (req, res, callback) {
            var connectId = this.connectId(req, res);
            var self = this;

            this.getConnectUser(connectId, function (user) {
                if (!user.userAgent || !user.ip) {
                    self.updateConnectUser(connectId, function (user) {
                        user.userAgent = req.headers['user-agent'];
                        user.ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
                        callback(user);
                        return user;
                    });
                } else {
                    callback(user);
                }
            });
        }
        , updateConnectUser: function (connectId, callback) {
            this.getConnectUser(connectId, function (user) {
                var oldJson = JSON.stringify(user);
                callback(user);
                var newJson = JSON.stringify(user);

                if (oldJson != newJson) {
                    avCache.set(_cacheKey.connectId(connectId), newJson);
                }
            });
        }
        , removeConnectUser: function (connectId) {
            var key = _cacheKey.connectId(connectId);
            avCache.del(key);
        }
        , getConnectUser: function (connectId, callback) {
            var self = this
            , key = _cacheKey.connectId(connectId);

            avCache.get(key, function (err, user) {
                if (user) {
                    try {
                        user = JSON.parse(user);
                        user = avril.extend({
                            connectId: connectId
                        }, user);
                    } catch (E) {
                        user = {
                            connectId: connectId
                        };
                    }
                    if (user.id) {
                        self.getCacheUser(_cacheKey.user(user.id), function (usr) {
                            user.userInfo = usr;
                            callback(user);
                        });
                    } else {
                        callback(user);
                    }
                } else {
                    callback(user);
                }
            });
        }

        , cookie: function (req, res) {
            return {
                set: function (key, value) {
                    res.cookie(key, value, {
                        path: '/'
                        , httpOnly: true
                    });
                    return value;
                }
                , get: function (key) {
                    return req.cookies[key];
                }
                , clear: function (key) {
                    res.clearCookie(key, {
                        path: '/'
                    });
                }
            };
        }
        , cookies: {}
        , setUserFindFunc : function(func) {
            this.getUserById = func;
        }
    });
}

var instances = {
    'default': WebAuth().init({
        name: 'defalut'
    })
};

WebAuth.get = function (name) {
    name = name || 'default';
    return instances[name] || (instances[name] = WebAuth().init({
        name: name
    }));
}

WebAuth.instances = instances;

module.exports = WebAuth;



