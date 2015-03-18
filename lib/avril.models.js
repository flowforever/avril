/**
 * Created by trump.wang on 2015/3/16.
 */
var models = {};

var msg = models.msg = {
    error: function (msg, data) {
        return this.msg('error', msg, data).extend('errorData', data);
    }
    , info: function (msg, data) {
        return this.msg('info', msg, data);
    }
    , warn: function (msg, data) {
        return this.msg('warn', msg, data);
    }
    , success: function (msg, data) {
        return this.msg('success', msg, data);
    }
    , confirm: function (msg, data) {
        return this.msg('confirm', msg, data, 'dialog');
    }
    , alert: function (msg, data) {
        return this.msg('alert', msg, data, 'dialog');
    }
    , promot: function (msg, data) {
        return this.msg('promot', msg, data, 'dialog');
    }
    , unauth: function (msg, data) {
        return this.msg('unauth', msg, data, 'access');
    }
    , failed: function (msg, data) {
        return this.msg('unauth', msg, data, 'access');
    }
    , msg: function (type, msg, data, uiType) {
        var self = exports;
        return {
            _helper: {
                msgTyps: Object.keys(self)
            }
            , msg: msg
            , type: type
            , data: data || {}
            , uiType: uiType || 'tip'
            , extend: function (key, value) {
                if (arguments.length == 2) {
                    this[key] = value;
                }
                if ((arguments.length == 1) && key && (Object.keys(key).length > 0)) {
                    require('avril').extend(this, key);
                }
                return this;
            }
            , help: function (key, value) {
                if (arguments.length == 2) {
                    this._helper[key] = value;
                }
                else if ((arguments.length == 1) && key && (Object.keys(key).length > 0)) {
                    require('avril').extend(this._helper, key);
                }
                return this;
            }
            , send: function (res) {
                res.send(this);
            }
        };
    }
};

models.handlers = {
    resultHandler : function (res) {
        return function (err, doc) {
            err && msg.error('请求出错', err).send(res);
            !err && msg.success('', doc).send(res);
        };
    }
    , createHandler : function (res) {
        return function (err, data) {
            err && msg.error('failed to create',err).send(res);
            !err && msg.success('success to create', data).send(res);
        }
    }
    , updateHandler : function (res) {
        return function (err) {
            err && msg.error('failed to update', err).send(res);
            !err && msg.success('success to update').send(res);
        }
    }
    , removeHandler : function(res){
        return function (err) {
            err && msg.error('failed to delete', err).send(res);
            !err && msg.success('success to delete').send(res);
        }
    }
    , autocomplete:function(res,map){
        map = map || {
            label:'name'
            , value:'_id'
        };
        return function(err,docs){
            res.send((docs||[]).map(function(item){
                var obj = {
                    label:item[ map.label ]
                    , value:item[map.value]
                };
                return obj;
            }));
        }
    }
};

module.exports = models;