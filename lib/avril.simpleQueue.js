/**
 * Created by trump on 14-11-22.
 */
var simpleCounter = require('./avril.simpleCounter');

module.exports = (function(){
    var queues = {};

    function Queue(name){
        var self = this;
        this.name = name;
        var queue = [];

        var pickNext = function(){
            var task = queue[0];
            if(task){
                var fn =task.fn;
                if(!task.status){
                    task.status = 'doing';
                    if(!task.paralId){
                        fn(function(){
                            task.status = 'done';
                            queue.shift();
                            pickNext();
                        });
                    }else{
                        var counter = simpleCounter(fn.length, function(){
                            task.status = 'done';
                            queue.shift();
                            pickNext();
                        });
                        for(var i=0; i< fn.length;i++){
                            wrapFn(fn[i])( counter.count );
                        }
                    }
                }
            }else{
                queues[name] = undefined;
            }
        };

        this.func = function(fn){
            if(arguments.length == 1){
                queue.push({fn: wrapFn(fn) } );
                pickNext();
            } else if( arguments.length > 1){
                // param calls
                queue.push({ fn: arguments, paralId: avril.guid() })
            }
            return this;
        };

        this.paralFunc = function(fn){
            var wrapSelf = arguments[1];
            if(!wrapSelf){
                wrapSelf = {
                    paralFunc: function(fn){
                        this.fnArr.push(fn);
                        return this;
                    }
                    , fnArr:[]
                    , exec: function() {
                        self.func.apply(self, this.fnArr);
                        this.exec = function() {
                            return self;
                        };
                        return self;
                    }
                    , func: function(){
                        this.exec();
                        return self.func.apply(self,arguments);
                    }
                };
            }
            return wrapSelf.paralFunc(fn);
        };

        this.exec = function(){
            return this;
        };

        var wrapFn = function(fn){
            if(fn.length >0){
                return fn;
            }
            return function(cb){
                fn();
                cb();
            }
        };

    }

    return function(name){
        name = name || new Date().getTime();
        return queues[name] || (queues[name] = new Queue(name));
    };

})();