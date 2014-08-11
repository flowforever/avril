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

    var app = express();

    /**/
    app.use(express['static'](__dirname + '/public'));

    app.use(express.compress());

    app.use(express.cookieParser());

    app.use(express.bodyParser());

    var avril = require('avril');

    avril.app = app;

    avril.initRootDir(__dirname);

    var appConfig = avril.getConfig('app');

    avril.initComponent('mvc', {
        app: app
        , viewEngine: require('jshtml')
        , routes: avril.getConfig('route')
        , appConfig: appConfig
        , styleResources: avril.getConfig('styleResources')
        , scriptResources: avril.getConfig('scriptResources')
    });

    avril.initComponent('localize', {});

    appConfig.port = appConfig.port || 9090;

    app.listen(appConfig.port);

    console.log('app now listening on :' + appConfig.port);
}