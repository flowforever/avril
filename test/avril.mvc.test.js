/**
 * Created by trump on 15-1-7.
 */
var avril = require('../index');

describe('avril.mvc', function(){
    var queue = avril.simpleQueue();

    queue.func(function(next){
        next();
    });

    it('')
});

