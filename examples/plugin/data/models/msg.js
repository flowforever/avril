module.exports = {
    error: function (msg, data) {
        return this.msg('error', msg, data);
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
    , msg: function (type, msg, data, innerType) {
        return {
            msg: msg
            , type: type
            , data: data || {}
            , innerType: innerType || 'tip'
        };
    }
};