var avril = require('avril');
var connectionString = avril.getConfig('db').mongo;
var ctx = avril.require('data.base')(connectionString)
, plugins = avril.require('data.dbPlugins')
, mongoose = require('mongoose')
, Schema = mongoose.Schema
, ObjectId = Schema.ObjectId;

ctx.define
/* system administrator */
('Admin', {
    name: String
    , email: String
    , password: String
    , phone: String
    , date: Date
    , status: String
})


/*normal user*/
('User', {
    email: String
    , password: String
    , phone: String
    , wxId: String
    , email: String
    , name: String
    , date: Date
    , status: String
    , locations: [{}]
})


/*Shop relate*/
('Shop', {
    name: String
    , location: String
    , relate: Number
    , wxId: String
    , wxNumber: String
    , phone: String
    , status: String
    , date: Date
})

('Meal', {
    name: String
    , dishId: String
    , type: String
    , img: String
    , thumbnail: String
    , images: [String]
    , weixinUrl: String
    , description: String
    , cookerName: String
    , cookerId: String
    , price: Number
    , expireDate: Date
    , supportNum: Number
    , antiNum: Number
    , dayOfWeek: String
})



('Order', {
    date: Date
    , userId: String
    , userName: String
    , deleteable: Boolean
    , getOnF1: Boolean
    , dishes: []
    , dishSuits: []
    , total: Number
    , status: String
    , payment: String
    , from: String
})

('Setting', {
    name: String
    , key: String
    , value: {}
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