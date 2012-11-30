var avril = require('./avril');
module.exports = {
    init: function (avril, options) {
        this.options = options;
    }
    , cacheKey: {}
    , _cacheKeyPre: 'avril_cachekey_'
    , addCacheKey: function (name) {
        var self = this;
        this.cacheKey[name] = function () {
            return (self._cacheKeyPre + name + avril.object.toArray(arguments).join('_')).toLocaleLowerCase();
        }
    }
    , redis: {
        createClient: function () {
            var redis = require('redis');
            return redis.createClient();
        }
    }
};

(function embedCacheKey() {
    'connectId,user,userId,randomId,secretKey,site'.split(',').forEach(function (name) {
        module.exports.addCacheKey(name);
    });
})();