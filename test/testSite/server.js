/**
 * Created by trump on 15-1-7.
 */
var program = require('commander');
program
    .version('0.0.1')
    .option('-p, --port <n>', 'Add peppers')
    .parse(process.argv);

var avril = require('../../index');
var port = program.port;

var express = require('express');

var app  = avril.app = express();

avril.initRootDir(__dirname);

/**/
app.use(express['static'](__dirname + '/public'));

app.use(express.compress());

app.use(express.cookieParser());

var appConfig = avril.getConfig('app');

avril.initComponent('mvc', {
    app: app
    , routes: avril.getConfig('route')
    , appConfig: appConfig
    , styleResources: avril.getConfig('styleResources')
    , scriptResources: avril.getConfig('scriptResources')
});

avril.initComponent('localize', {});

appConfig.port = port || appConfig.port || 9090;

app.listen(appConfig.port);

console.log('app now listening on :' + appConfig.port + ', at:' + new Date());

