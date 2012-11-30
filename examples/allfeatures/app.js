var express = require('express');
var app = express();

var avril = require('avril');

avril.initRootDir(__dirname);

avril.extend(avril.mvc.Mvc.config, {
    controller_dir_name: 'controllers',
    view_dir_name: 'views',
    area_dir_name: 'areas',
    share_dir_name: 'shares',
    viewExtension: '.cshtml'
});

avril.initComponent('mvc', { app: app, viewEngine: require('jshtml') });


var appConfig = avril.extend(avril.getConfig('app'), process.env);

app.listen(appConfig.port);