var avril = require('avril');
var connectionString = avril.getConfig('db').mongo;
var ctx = avril.require('data.base')(connectionString)
, plugins = avril.require('data.dbPlugins')
, mongoose = require('mongoose')
, Schema = mongoose.Schema
, ObjectId = Schema.ObjectId
, commonStatus = {
    actived: 'actived'
    , inactived: 'inactived'
    , blocked: 'blocked'
}

var defDate = function () {
    return {
        type: Date
            , index: true
            , 'default': Date.now
    };
}

ctx.define
/* system administrator */
('User', {
    email: String
    , password: String
    , phone: String
    , wxId: String
    , wxPass: String
    , wxFakeId: String
    , email: String
    , name: String
    , date: defDate()
    , modifyDate: defDate()

    , address: String

    , status: String
}, {
    status: commonStatus
})

;

ctx.User.UserStatus = {
    actived: 'actived'
    , blocked: 'blocked'
    , unconfirmed: 'unconfirmed'
};

ctx._schema.User.plugin(plugins.unique, { key: 'email', table: ctx.User });

for (var s in ctx._schema) {
    ctx._schema[s].pre('save', plugins.dateNow);
}

module.exports = ctx;