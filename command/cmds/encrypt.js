var fs = require("fs-extra");
var path = require("path");
var util = require("util");
var rl = require("readline").createInterface(process.stdin, process.stdout);

var Wind = require("wind");
Wind.logger.level = Wind.Logging.Level.OFF;

var Async = Wind.Async;
var Task = Async.Task;
var Binding = Async.Binding;

var readFileAsync = Binding.fromStandard(fs.readFile);
var writeFileAsync = Bingding.fromStandard(fs.writeFile);
var readdirAsync = Bingding.fromStandard(fs.readdir)

module.exports.exec = function (source, target) {
    if (arguments.length == 1) {
        target = source;
        source = undefined;
    }
    var encryptAsync = eval(Wind.compile("async", function (srcDir, targetDir) {
    	
    }));
    encryptAsync(source, target);
}