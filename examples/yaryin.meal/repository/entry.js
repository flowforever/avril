module.exports = {
    get: function (name, modelName) {
        if (this.entries[name]) {
            return this.entries[name];
        } else {
            try {
                this.entries[name] = require('.' + name);
            } catch (E) {

            }
        }
    }
    , entries: {}
};