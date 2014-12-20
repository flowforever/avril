var avril = require('avril')
, db = avril.require('data.db')
, msg = avril.require('data.models.msg')
, auth = avril.auth.get()
, jshashes = require('jshashes')
, MD5 = new jshashes.MD5()
, userServices = avril.require('services.user')
;
module.exports = {
    login: function (req, res, next, helper) {
        res.view();
    }
    , 'login[post]': function (req, res, next, helper) {
        if (req.body.email && req.body.password) {
            db.User.findOne({
                email: req.body.email
                , password: MD5.hex(req.param('password'))
            }, function (err, user) {
                if (!err) {
                    if (user) {
                        user.id = user._id;
                        auth.login(req, res, user, function () {
                            res.send(msg.success('Login successfully .', {
                                url: '/dashboard/home/index'
                                , user: { email: req.body.email, name: user.name, id: user.id }
                            }));
                        });
                    } else {
                        res.send(msg.error('Invalid email address or password.'.localize(helper), {
                            email: req.param('email')
                        }));
                    }
                }
            });
        } else {
            res.send(msg.error('Email address or password is required.'.localize(helper)));
        }
    }
    , register: function (req, res, next, helper) {
        res.view();
    }
    , 'register[post]': function (req, res, next, helper) {
        var activeCode = avril.guid();

        var userModel = avril.extend({}, req.body, {
            activeCode: activeCode
        });

        userServices.addUser(userModel, function (err) {
            if (!err) {
                res.send(msg.success('Register an new account successfully .'.localize(helper)));
            } else {
                res.send(msg.error(err.toString().localize(helper)));
            }
        });
    }
    , unauthorized: function (req, res, next, helper) {
        res.status(203);
        res.end('Non-Authoritative ');
    }
    , register: function (req, res, next, helper) {
        res.view();
    }
    , 'logout': function (req, res, next, helper) {
        if (helper.authorize.user) {
            auth.logout(req, res, function () {
                res.redirect('/');
            });
        } else {
            res.redirect('/');
        }
    }
    , getUserProfile: function (req, res, next, helper) {
        var userInfo = helper.authorize.user && helper.authorize.user.userInfo || {};
        delete userInfo['password'];
        delete userInfo['__v'];
        delete userInfo['date'];
        delete userInfo['modifyDate'];
        delete userInfo['_id'];
        delete userInfo['connectIds'];
        res.send(userInfo);
    }
    , 'postUserProfile[post]': function (req, res, next, helper) {
        if (helper.authorize.user.userInfo) {
            var userInfo = helper.authorize.user;
            var toSave = req.body;
            for (var k in toSave) {
                if (!toSave[k]) {
                    delete toSave[k];
                }
            }
            if (toSave.confirmpassword) {
                delete toSave['confirmpassword'];
            }

            userServices.updateUser(userInfo.id, toSave, function (err, user) {
                err && res.send(msg.error(err.toString(), toSave));

                if (!err) {
                    auth.updateCacheUser(userInfo.id, function (usr) {
                        avril.extend(usr, toSave, user);
                        res.send(msg.success('Update success.', user));
                    });
                }
            });

        } else {
            res.send(msg.unauth('对不起,您不能访问该功能。'.localize(helper)));
        }

    }
};