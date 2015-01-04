var fs = require('fs-extra')
, path = require('path')
, http = require('http');

var avrilSimpleQueue = require('../../lib/avril.simpleQueue');

var config = require('../../package.json');

module.exports.exec = function (name, latest) {

    name = name || 'avril-project';

    var copyFrom = path.resolve(__dirname, '../templates/server.zip');

    if(latest){

        var file = fs.createWriteStream(copyFrom);
        
        file.on('finish',function(){
            console.log('saving file, '+copyFrom);
            file.close();
            checkAndCreate();
        });

        http.get(config.serverTemplateUrl || 'http://avril-js.com/templates/avril-template.zip', function(response){
            if(response.statusCode == 200){
                console.log('please do not close window, downloading ... ');
                response.pipe(file);
            }else{
                console.log('Update local template file failed.');
                checkAndCreate();
            }            
        });

    }else{
        checkAndCreate();
    }

    function checkAndCreate(){
        if (!fs.existsSync(copyFrom)) {
            console.log(copyFrom + ' is not existed.');
            return false;
        }
        extraFile();
    }    

    function extraFile() {
        var copyTo = name ? path.resolve(process.cwd(), name) : process.cwd();
        var AdmZip = require('adm-zip');
        // reading archives
        var zip = new AdmZip(copyFrom);
        console.log('creating (' + copyTo + ') ...');
        zip.extractAllTo(copyTo, true);
        console.log('finished (' + copyTo + ')');
    }


}