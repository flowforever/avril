var avril = require('avril')
, jshashes = require('jshashes')
, MD5 = new jshashes.MD5()
, db = avril.require('data.db')
, users = db.User
;

var exports = module.exports = {
    addUser: function (userModel, callback) {
        var toSave = avril.extend(true, {}, userModel, {
            password: MD5.hex(userModel.password)
        });
        users.findOne({ email: userModel.email }, function (err, user) {
            !user && users.add(toSave, callback);
            user && callback('user' + toSave.email + ' existed.');
        });
    }
    , updateUser: function (userId, update, callback) {
        if (update.password) {
            update.password = MD5.hex(update.password);
        }
        users.findOne({ _id: userId }, function (err, user) {
            if (err) {
                callback(err);
                return false;
            }
            if (!user) {
                callback('user not found.');
            } else {
                if (user.email != update.email) {
                    users.findOne({ email: update.email }, function (err, usr) {
                        if (err) { callback(err); return false; }
                        if (usr) { callback('email is existed.'); }
                        else {
                            users.update({ _id: userId }, update, callback);
                        }
                    });
                } else {
                    users.update({ _id: userId }, update, callback);
                }
            }
        });
    }
};