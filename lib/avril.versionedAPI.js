/**
 * Created by trump on 14-12-27.
 */
/*
 * @param apiDefine: {
 *   "defaultGetMethod1": function(req, res, next, helper){
 *
 *   }
 *   ,"defaultGetMethod2": function(req, res, next, helper){
 *
 *   }
 *   ":1.0": {
 *       defaultGetMethod1: function(){
 *
 *       }
 *   }
 *   , ":config":{
 *   }
 * }
 * */
module.exports = function(apiDefine) {
    var api = {};
    Object.keys(apiDefine).forEach(function(key){
        "use strict";
        if(key.indexOf(':config') === 0){
            api[':config'] = apiDefine[':config'];
        } else if(typeof apiDefine[key] === 'function'){
            api[key] = function(req, res) {
                var version = req.param('v');
                if(!version){
                    return apiDefine[key].apply(apiDefine, arguments);
                }else{
                    var versionApi = apiDefine[':'+version];
                    if(versionApi && versionApi[key]){
                        return versionApi[key].apply(apiDefine, arguments);
                    }else{
                        res.header('api-status', 'not-found');
                        return apiDefine[key].apply(apiDefine, arguments);
                    }
                }
            }
        }
    });
    return api;
};
