/**
 * Created by trump on 15-1-7.
 */
module.exports = {
   index: function(req, res, next, helper) {
       res.end('hello avril');
   }
    , main: function(req, res, next, helper) {
        res.view();
    }
};