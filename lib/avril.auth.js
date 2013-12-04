var avril = require('./avril')
    , _cacheKey = require('./avril.cache').cacheKey
    , redis = require('redis')
    , client = redis.createClient()
    , guid = function () {
        return new Date().getTime() + '-' + Math.random().toString().replace('.', '') + Math.random().toString().replace('.', '');
    }
    , jshashes = require('jshashes')
    , MD5 = new jshashes.MD5()
    , sysCookies = 'connectId,userStatus'.split(',')
    , config = {
        cacheExpire: 60 * 15
    };

var cookiePath = '';

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
            }
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

                this.updateCacheUser(_cacheKey.user(user.id), function (_user) {

                    avril.extend(true, _user, user);

                    if (!_user.connectIds) { _user.connectIds = []; }

                    _user.connectIds.push(connectId);

                    self.updateConnectUser(connectId, function (usr) {
                        usr.id = user.id;
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
                var req = arguments[0], res = arguments[1], userId = arguments[2], callback = arguments[3];
                callback = avril.callback(callback);
                var connectId = this.connectId(req, res);

                this.removeConnectUser(connectId);

                this.cookies.connectId.remove(req, res);

                self.cookies.userStatus(req, res, userStatus.offline(connectId));

                this.updateCacheUser(_cacheKey.user(userId), function (user) {
                    user.connectIds.splice(user.connectIds.indexOf(connectId), 1);
                });

                callback();
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
                var req = arguments[0], res = arguments[1], next = arguments[2];
                /*todo : compare user agent */
                var connectId = this.connectId(req, res);
                var self = this;
                this.getConnectUser(connectId, function (user) {
                    var isLogin = self.cookies.userStatus(req, res) == userStatus.online(connectId);
                    next(user.id, user);
                });
            }
        }

        , getCacheUser: function (cacheKey, callback) {
            var self = this;

            client.get(cacheKey, function (err, user) {
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
                        client.set(key, JSON.stringify(user));
                    }
                    callback(user);
                } else {
                    callback(null);
                }
            }
        }
        , updateCacheUser: function (cacheKey, callback, timeout) {
            this.getCacheUser(cacheKey, function (user) {
                user = user || {};
                var org = JSON.stringify(user);
                callback(user);
                var newJson = JSON.stringify(user);
                if (org != newJson) {
                    client.set(cacheKey, newJson);
                }
                if (timeout) {
                    client.expire(cacheKey, timeout);
                }
            });
        }
        , removeCacheUser: function (cacheKey, callback) {
            client.del(cacheKey, function () {
                callback();
            });
        }

        , expire: function (key, timeout) {
            client.expire(key, timeout);
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
                    client.set(_cacheKey.connectId(connectId), newJson);
                }
            });
        }
        , removeConnectUser: function (connectId) {
            var key = _cacheKey.connectId(connectId);
            client.del(key);
        }
        , getConnectUser: function (connectId, callback) {
            var self = this
            , key = _cacheKey.connectId(connectId);
            client.get(key, function (err, user) {
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
                    user = {
                        connectId: connectId
                    };
                    client.set(key, JSON.stringify(user), function () {
                        callback(user);
                    });
                    client.expire(key, config.cacheExpire);
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



