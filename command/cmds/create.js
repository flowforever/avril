var fs = require('fs-extra')
, path = require('path');
module.exports.exec = function (name) {
    name = name || 'avril-project';

    var copyFrom = path.resolve(__dirname, '../templates/server.zip');

    if (!fs.existsSync(copyFrom)) {
        console.log(copyFrom);
        return false;
    }
    var copyTo = name ? path.resolve(process.cwd(), name) : process.cwd();

    var AdmZip = require('adm-zip');

    // reading archives
    var zip = new AdmZip(copyFrom);
    console.log('creating (' + copyTo + ') ...');
    zip.extractAllTo(copyTo, true);
    console.log('finished (' + copyTo + ')');
}