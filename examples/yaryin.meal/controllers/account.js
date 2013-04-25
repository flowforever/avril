var avril = require('avril')
, db = avril.require('data.db')
, msg = avril.require('data.models.msg')
, auth = avril.auth.get()
, jshashes = require('jshashes')
, MD5 = new jshashes.MD5();
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
                            }));
                        });
                    } else {
                        res.send(msg.error('Invalid email address or password.'.localize(helper), {
                            email: req.param('email'),
                            password: req.param('password')
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
        db.User.add({
            email: req.param('email')
            , name: req.param('name')
            , password: MD5.hex(req.param('password'))
            , activeCode: activeCode
        }, function (err) {
            if (!err) {
                res.send(msg.success('Register an new account successfully .'.localize(helper), {
                    url: '/me/home/index'
                }));
            } else {
                res.send(msg.error(err.toString()));
            }
        });
    }
    , unauthorized: function (req, res, next, helper) {
        res.status(203);
        res.end('Non-Authoritative ');
    }
    , verifyCode: function () {
        var Canvas = require('canvas')
          , canvas = new Canvas(200, 200)
          , ctx = canvas.getContext('2d');

        ctx.font = '30px Impact';
        ctx.rotate(0.1);
        ctx.fillText("Awesome!", 50, 100);

        var te = ctx.measureText('Awesome!');
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.lineTo(50, 102);
        ctx.lineTo(50 + te.width, 102);
        ctx.stroke();

        res.end('<img src="' + canvas.toDataURL() + '" alt="" />');
    }
    , register: function (req, res, next, helper) {
        res.view();
    }
    , logout: function (req, res, next, helper) {
        if (helper.authorize.user._id) {
            auth.logout(req, res, helper.authorize.user._id, function () {
                res.redirect('/');
            });
        } else {
            res.redirect('/');
        }
    }
    , wxlogin: function (req, res, next, helper) {
        res.view();
    }
    , wxLogin: function (req, res, next, helper) {

    }
};