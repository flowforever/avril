module.exports = function (port) {
    var cluster = require('cluster');
    var numCPUs = require('os').cpus().length;

    if (cluster.isMaster) {
        // Fork workers.
        for (var i = 0; i < numCPUs; i++) {
            cluster.fork();
        }

        cluster.on('exit', function (worker, code, signal) {
            console.log('worker ' + worker.process.pid + ' died');
        });
    } else {
        // Workers can share any TCP connection
        // In this case its a HTTP server

        var express = require('express');
        var avril = require('avril');
        var app = express();

        /**/
        app.configure(function () {
            app.use(express['static'](__dirname + '/public'));

            app.use(express.compress());

            app.use(express.cookieParser());

            app.use(function (req, res, next) {
                req.rawData = '';
                req.on('data', function (chunk) { req.rawData += chunk });
                next();
            });

            app.use(express.bodyParser());
        });

        var avril = require('avril');

        avril.initRootDir(__dirname);

        avril.initComponent('mvc', { app: app, viewEngine: require('jshtml') });

        avril.initComponent('localize', { provier: 'file' });

        var appConfig = avril.getConfig('app');

        app.listen(port || appConfig.port);
    }
}