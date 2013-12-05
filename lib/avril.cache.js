var avril = require('./avril');
module.exports = {
    init: function (avril, options) {
        this.options = options;
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
            return redis.createClient();
        }
    }
};

(function embedCacheKey() {
    'connectId,user,userId,randomId,secretKey,site'.split(',').forEach(function (name) {
        module.exports.addCacheKey(name);
    });
})();