var avril = require('./avril');
var redisConfig = {
    port:6379
    , host:'127.0.0.1'
    , options:{}
};
module.exports = {
    init: function (avril, options) {
        if(options){
            if(options.redis){
                avril.extend(redisConfig,options.redis);
            }
        }
    }
    , cacheKey: {}
    , _cacheKeyPre: 'avril_cachekey_'
    , addCacheKey: function (name) {
        var self = this;
        if (!this.cacheKey[name]) {
            var cacheKeyFunc = this.cacheKey[name] || (this.cacheKey[name] = function () {
                return (self._cacheKeyPre + name + avril.object.toArray(arguments).join('_')).toLocaleLowerCase();
            });
            cacheKeyFunc.isValidKey = function (cachekey) {
                return cachekey.indexOf(self._cacheKeyPre + name) == 0;
            }
            cacheKeyFunc.toValid = function (cachekey) {
                if (!cacheKeyFunc.isValidKey(cachekey)) {
                    return self._cacheKeyPre + name + cachekey;
                }
                return cachekey;
            }
        }

        return this.cacheKey[name];

    }
    , redis: {
        createClient: function () {
            var redis = require('redis');
            return redis.createClient(redisConfig.port, redisConfig.host, redisConfig.options);
        }
    }
    , client: function () {
        return this.redis.createClient( redisConfig.port,redisConfig.host,redisConfig.options );
    }
    , set: function (key, value, func, expire) {
        if (arguments.length >= 2) {
            func = func || function(){ };
            var client = this.client();
            client.on('connect',function(){
                client.set(key, value, func, expire);
            });
            client.on('error',func)            
        } else {
            typeof func == 'function' && func();
        }
    }
    , get: function (key, func) {
        var client = this.client();
        client.on('connect',function(){
            client.get(key, func);
        });
        client.on('error',func)
    }
    , del:function(key,func){
        var client = this.client();
        func = func || function(){};
        client.on('connect',function(){
            client.del(key, func);
        });
        client.on('error',func);
    }
    , expire:function(key,timeout,func){
        var client = this.client();
        func = func || function(){};
        client.on('connect',function(){
            client.expire(key, timeout, func);
        });
        client.on('error',func)
    }
};

(function embedCacheKey() {
    'connectId,user,userId,randomId,secretKey,site'.split(',').forEach(function (name) {
        module.exports.addCacheKey(name);
    });
})();