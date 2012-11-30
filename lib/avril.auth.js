var avril = require('./avril')
    , cacheKey = require('./avril.cache').cacheKey
    , redis = require('redis')
    , client = redis.createClient()
    , CONNECTID = 'connectid'
    , guid = function () {
        return new Date().getTime() + '-' + Math.random().toString().replace('.', '') + Math.random().toString().replace('.', '');
    }
    , jshashes = require('jshashes')
    , MD5 = new jshashes.MD5();

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

function Auth() {
    if (!(this instanceof Auth)) {
        return new Auth();
    }
    this.guid = avril.guid();
}

Auth.prototype = {

    init: function (options) {

        var self = this;

        avril.extend(this, options);

        var sysCookies = 'connectId,clientId,userStatus'.split(',');

        sysCookies.forEach(function (key) {
            var funKey = key + self.guid;
            var hashKey = MD5.hex(funKey.toLowerCase()), upperKey = MD5.hex(funKey.toUpperCase());
            var func = self.cookies[key] = function (req, res, value) {
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
            func.cookieKey = hashKey;
            func.remove = function (req, res) {
                self.cookie(req, res).clear(hashKey);
            }
        });

        return this;
    }

    , findUser: function (id) {
        /*find from db*/
        var db = avril.require('datacontext.db');
        db.User.findOne({
            _id: userId
        }, function (e, u) {

        });
    }

    , login: function (req, res, user, next) {
        var self = this
            , connectId = this.connectId(req, res)
            , key = cacheKey.user(user._id)
            , connectIdKey = cacheKey.connectId(connectId);

        /* this will make sure the same user has the same connectId . */
        module.exports.cookies.userStatus(req, res, userStatus.online(connectId));

        this.updateCacheUser(user.id, function (_user) {
            avril.extend(true, _user, user);

            if (!_user.connectIds) { _user.connectIds = []; }

            _user.connectIds.push(connectId);

            self.updateConnectUser(connectId, function (usr) {
                usr.id = user.id;
                usr.isLogin = true;
                next();
                return usr;
            });

            return _user;
        });
    }

    , logout: function (req, res, callback) {
        var connectId = this.connectId(req, res);
        this.removeConnectUser(connectId);
        this.cookies.connectId.remove(req, res);
        this.updateCacheUser(req, res, function (user) {
            user.connectIds.splice(user.connectIds.indexOf(connectId), 1);
        });
        callback();
    }

    , logoutAll: function (req, res, callback) {
        var self = this;
        this.cacheUser(req, res, function (user) {
            for (var i = 0; user.connectIds.length; i++) {
                self.removeConnectUser(user.connectIds[i]);
            }
            self.removeCacheUser(user.id);
        });
    }

    , isAuth: function (req, res, next) {
        /*todo : compare user agent */
        var connectId = this.connectId(req, res);
        var self = this;
        this.getConnectUser(connectId, function (user) {
            var isLogin = true; //module.exports.cookies.userStatus(req, res) == userStatus.online(connectId);
            next(user != null
                && user.id != null && isLogin
                && user.userAgent == req.header['user-agent']
                , user);
        });
    }

    , connectId: function (req, res, val) {
        return this.cookies.connectId.apply(this.cookies, arguments);
    }

    , isConnectId: function (cnnId) {
        return cnnId && cnnId.indexOf(MD5.hex(sysCookies[0].toUpperCase())) == 0;
    }

    , connectUser: function (req, res, callback) {
        var connectId = this.connectId(req, res);
        var self = this;
        this.getConnectUser(connectId, function (user) {
            if (!user.userAgent || !user.ip) {
                self.updateConnectUser(connectId, function (user) {
                    user.userAgent = req.headers['user-agent'];
                    user.ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
                    callback(null, user);
                    return user;
                });
            } else {
                callback(null, user);
            }
        });
    }

    , cacheUser: function (req, res, callback) {
        var self = this;
        this.connectUser(function (cnnUser) {
            self.getCacheUser(cnnUser.id, function (user) {
                callback(user);
            });
        });
    }

    , getConnectUser: function (connectId, callback) {
        var self = this;
        var key = cacheKey.connectId(connectId)
            , userId = _connectIdUserIdCache[connectId];

        if (userId) {
            this.getCacheUser(userId, callback);
        } else {
            client.get(key, function (err, user) {
                if (user) {
                    try {
                        user = JSON.parse(user);
                        user = avril.extend({
                            connectId: connectId
                            , clients: []
                            , sockets: []
                            , recentSites: []
                            , recentClients: []
                            , cacheKeys: []
                        }, user);
                    } catch (E) {
                        user = {
                            connectId: connectId
                            , clients: []
                            , sockets: []
                            , recentSites: []
                            , recentClients: []
                            , cacheKeys: []
                        };
                    }
                    if (user.id) {
                        _connectIdUserIdCache[connectId] = user.id;
                        self.getCacheUser(user.id, function (usr) {
                            callback(usr);
                        });
                    } else {
                        callback(user);
                    }
                } else {
                    user = {
                        connectId: connectId
                        , clients: []
                        , sockets: []
                        , recentSites: []
                        , recentClients: []
                    };
                    client.set(key, JSON.stringify(user), function () {
                        callback(user);
                    });
                }

            });
        }
    }

    , updateConnectUser: function (connectId, callback) {
        this.getConnectUser(connectId, function (user) {
            var oldJson = JSON.stringify(user);
            callback(user);
            var newJson = JSON.stringify(user);
            if (oldJson != newJson) {
                if (_connectIdUserIdCache[connectId]) {
                    client.set(cacheKey.user(_connectIdUserIdCache[connectId]), newJson);
                } else {
                    client.set(cacheKey.connectId(connectId), newJson);
                }
            }
        });
    }

    , removeConnectUser: function (connectId) {
        var key = cacheKey.connectId(connectId);
        client.del(key);
    }

    , getCacheUser: function (userId, usr, callback) {
        var self = this;
        var key = cacheKey.user(userId);
        if (arguments.length == 3) {
            handleUser(usr, callback, true);
        } else if (arguments.length == 2) {
            callback = usr;
            client.get(key, function (err, user) {
                try {
                    user = user ? JSON.parse(user) : null;
                } catch (E) { user = null; }
                handleUser(user, callback);
            });
        }
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

    , updateCacheUser: function (userId, callback) {
        this.getCacheUser(userId, function (user) {
            var key = cacheKey.user(userId)
            var org = JSON.stringify(user);
            callback(user);
            var newJson = JSON.stringify(user);
            if (org != newJson) {
                client.set(key, newJson);
            }
        });
    }

    , removeCacheUser: function (userId) {
        var key = cacheKey.user(connectId);
        redis.createClient().del(key);
    }

    , cookie: function (req, res) {
        return {
            set: function (key, value) {
                res.cookie(key, value, {
                    path: '/'
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
};

Auth.instances = {};

Auth.get = function (guid) {
    guid = guid || 'default';
    return Auth.instances[guid] || (Auth.instances[guid] = Auth().init({
        guid: guid
    }));
};

Auth.get('default');

module.exports = Auth;



