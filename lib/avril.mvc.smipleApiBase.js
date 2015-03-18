/**
 * Created by trump.wang on 2015/3/18.
 */
var avril = require('./avril');

var models = require('./avril.models');
var msg = models.msg;
var handler =models.handlers;

module.exports = function(dbModel, controller, options) {

    var appConfig = {
        defaultPageSize: 10
        , maxListSize: 1000
    };

    avril.extend(appConfig, options);

    controller = controller || {};

    controller.$table = dbModel;

    return avril.extend(true, {
        '': function(req, res, next, helper) {
            var filterJSON = req.query.filter || '{}'
                , limit = Math.min( req.query.limit || appConfig.defaultPageSize, appConfig.maxListSize )
                , skip = req.query.skip || 0
                , filter;

            try{
                filter = JSON.parse(filterJSON);
            }catch (E){
                return res.end('invalid query');
            }

            dbModel.find(filter).sort(req.query.sort || '-date').limit(limit).skip(skip * limit).exec(function(err, docs){
                res.send(err || docs);
            });
        }

        , '[post]create': function(req, res, next, helper) {
            dbModel.add(req.body, handler.createHandler(res));
        }

        , '[post]update': function(req, res) {
            console.log(req.query)
            dbModel.findById(req.body.id,  function(err, doc) {
                if(err){
                    return msg.failed(err.msg, err).send(res);
                }
                for(var k in req.body){
                    doc[k] = req.body[k];
                }
                doc.save(handler.updateHandler(res));
            })
        }

        , 'detail/:id': function(req, res, next, helper) {
            dbModel.findById(req.params.id, function(err, item){
                res.send(item);
            });
        }

        , '[post]delete/:id': function(req, res, next, helper) {
            dbModel.remove({ _id: req.params.id  }, function(){
                msg.success('remove success').send(res);
            });
        }

        , 'count': function(req, res, next, helper) {
            var filterJSON = req.body.filter || req.query.filter || '{}'
                , filter;

            try{
                filter = JSON.parse(filterJSON);
            }catch (E){
                return res.end('invalid query');
            }

            dbModel.count(filter, function(err, count){
                res.end(count+'');
            });
        }
    }, controller);
};