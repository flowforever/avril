var avril = require('avril')
, Page = avril.require('data.models.page');
function helper(model) {
    return {
        add: function (meal, callback) {
            model.add(meal, callback);
        }
        , update: function (meal, callback) {
            model.update(meal, callback);
        }
        , findById: function (id, callback) {
            model.findOne({
                id: id
            }, callback);
        }
        , list: function (query, callback, currentIndex) {
            Page.mongoose(model, query, callback, currentIndex);
        }
        , remove: function (ids, callback) {
            if (typeof (id) == 'string') {
                ids = ids.split(',');
            }
            model.find({
                id: {
                    $in: ids
                }
            }).remove(callback);
        }
    };
}

module.exports = helper;