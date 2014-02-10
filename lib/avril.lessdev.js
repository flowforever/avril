var fs = require('fs-extra')
, path = require('path')
, less = require('less');

module.exports = {
    init: function (avril, options) {
        this.avril = avril;

        //options : { dirs : [  { 'source': , 'targetDir' } , {'sourceDir1' :'targetDir1'} ] }
        options = options || {};

        var rootDir = this.rootDir = (options.rootDir || avril.rootDir)
        , compress = options.compress == true;

        this.dirs = options.dirs;

        var self = this;


        if (options && options.dirs) {
            options.dirs.forEach(function (dir) {
                var key = Object.keys(dir)[0]
                    , devPath = path.join(rootDir, key)
                    , releasePath = path.join(rootDir, dir[key]);

                self.watchDir(devPath, releasePath);
            });
        }

        return this;
    }

    , watchDir: function (devPath, releasePath) {
        var self = this;
        var lessreg = /\.less$|\.css$/;
        fs.watch(devPath, function (event, file) {
            if (file) {
                var filePath = path.join(devPath, file);
                fs.stat(filePath, function (err, stat) {
                    if (stat.isFile()) {
                        if (lessreg.test(file)) {
                            fs.readFile(filePath, 'utf8', function (err, ls) {
                                less.render(ls, function (e, css) {
                                    fs.writeFile(path.join(releasePath, file.replace(lessreg, '') + '.css'), css, 'utf8');
                                });
                            });
                        } else {
                            fs.copy(filePath, path.join(releasePath, file));
                        }
                    } else if (stat.isDirectory()) {
                        fs.mkdir(path.join(releasePath, file), function () {
                            self.watchDir(path.join(devPath, file), path.join(releasePath, file));
                        });
                    }
                });
            }
        });
    }
    , compress: function () {

    }
};