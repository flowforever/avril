var avril = require('./lib/avril');

avril.config = require('./package.json');

avril.cache = require('./lib/avril.cache');

avril.mvc = require('./lib/avril.mvc');

avril.mvc.minify = require('./lib/avril.mvc.minify');

avril.localize = require('./lib/avril.localize');

avril.auth = require('./lib/avril.auth');

avril.mongoose = require('./lib/avril.mongoose');

avril.simpleCounter = require('./lib/avril.simpleCounter');

avril.simpleQueue = require('./lib/avril.simpleQueue');

avril.versionedAPI = require('./lib/avril.versionedAPI');

module.exports = avril;