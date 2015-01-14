/**
 * Created by trump on 14-11-22.
 */
var simpleCounter = require('./avril.simpleCounter');
var avril = require('./avril');

module.exports = (function() {
    function $AwaitData(queue) {
        this.queue = queue;
        this.isDone = false;

        var result ;
        this.error = function(){ };
        this.result = function(value){
            result = value; 
            return result;
        };
    }

    function Queue(){
        var self = this
            , queue = []
            , parallers = []
            , data = {}
            , getArgArray = function(arg){
                return Array.prototype.slice.call(arg);
            };

        var getLastParalWrapper = function(){
            return parallers[parallers.length - 1];
        };
        var breakParal = function(){
            parallers.push(null);
        };
        var pickNext = function(){
            var task = queue[0];
            if(task){
                task.id = avril.guid();
                var fn =task.fn;
                if(!task.status){
                    task.status = 'doing';
                    var subQueue = new Queue();
                    var _next = function() {
                        task.status = 'done';
                        queue.shift();
                        subQueue.func(pickNext);
                    };
                    if(!task.paralId){
                        fn.call(subQueue, _next, task);
                    }else{
                        var counter = simpleCounter(fn.length, _next);
                        for(var i=0; i< fn.length;i++){
                            wrapFn(fn[i]).call(subQueue, counter.count, task );
                        }
                    }
                }
            }
        };
        var wrapFn = function(fn){
            if(fn.length >0){
                return fn;
            }
            return function(cb){
                fn.call(this);
                cb();
            }
        };

        this.func = function(fn) {
            var paralWraper = getLastParalWrapper();
            if(paralWraper){
                paralWraper.exec();
            }
            if(arguments.length == 1){
                queue.push({ fn: wrapFn(fn) } );
                pickNext();
            } else if( arguments.length > 1){
                // param calls
                queue.push({ fn: arguments, paralId: avril.guid() })
            }
            return this;
        };

        this.insertFunc = function(currentTask, func) {
            var currentIndex = 0;
            for(; currentIndex < queue.length && queue[currentIndex].id != currentTask.id; currentIndex++);
            queue[currentIndex].insertCounter = queue[currentIndex].insertCounter || 0;
            queue[currentIndex].insertCounter++;
            queue.splice(currentIndex + queue[currentIndex].insertCounter,0,{ fn: wrapFn(func) });
            return this;
        };

        this.paralFunc = function(fn){

            var parallerWrapper = getLastParalWrapper();

            if(!parallerWrapper){
                parallerWrapper = {
                    paralFunc: function(fn){
                        if(!fn || arguments.length == 0){
                            return this;
                        }
                        this.fnArr.push(fn);
                        return this;
                    }
                    , fnArr:[]
                    , exec: function() {
                        breakParal();
                        self.func.apply(self, this.fnArr);
                        return self;
                    }
                    , func: function(){
                        this.exec();
                        return self.func.apply(self,arguments);
                    }
                };
                parallers.push(parallerWrapper);
            }

            return parallerWrapper.paralFunc(fn);
        };

        this.exec = function(){
            return this;
        };

        this.data = function(key, value) {
            switch (arguments.length){
                case 0: return data;
                case 1: return data[key];
                case 2: data[key] = value; break;
            }
            return this;
        };

        this.ensure = function(key, value){
            if(this.data(key) === undefined){
                this.data(key, value);
            }
            return this;
        };

        var cbFactory = function(isParal){
            return function ( /* asyncCall ,args..., fn */ ) {

                var argArr = getArgArray(arguments)
                    , hasCtx = argArr.length >= 3 && avril.isFunction(argArr[1])
                    , ctx = hasCtx && argArr[0]
                    , asyncCall = hasCtx ? argArr[1] : argArr[0]
                    , lastArg = argArr[argArr.length - 1]
                    , hasFn = avril.isFunction(lastArg)
                    , fn = hasFn ? lastArg : function() {
                        var argKey = asyncArgs.filter(function(arg){
                            var type =  typeof arg;
                            return type === 'string' || type === 'number';
                        }).join('-');
                        argKey && self.data( argKey , arguments );
                    }
                    , asyncArgs = argArr.splice( hasCtx? 2: 1, argArr.length - ( (hasCtx? 3 : 2) - (hasFn? 0 : 1) ));

                (isParal? self.paralFunc: self.func)(function(next) {

                    //TODO: handle await object
                    asyncArgs.push(function(){

                        var asyncResArgs = getArgArray(arguments).map(function(arg){
                            if(arg instanceof $AwaitData){
                                return arg.result();
                            }
                            return arg;
                        });

                        var asyncHasCallback = asyncResArgs.length < fn.length;

                        if(asyncHasCallback) {
                            asyncResArgs.push(next);
                            asyncResArgs.pop();
                            asyncResArgs.push(asyncArgs);
                        }

                        fn.apply(ctx, asyncResArgs);

                        !asyncHasCallback && next();
                    });
                    asyncCall.apply(ctx, asyncArgs);
                });

            };
        };

        var eachCbFactory = function(isParal){
            return function(asyncCall , eachArgs, fn) {
                var ctx
                    , standardiseArg = function(arg){
                        if(arg instanceof  Array) {
                            return arg;
                        }
                        if(arg && arg.length >= 0){
                            return getArgArray( arg );
                        }
                        return [arg];
                    };
                if(arguments.length == 4){
                    ctx = arguments[0];
                    asyncCall = arguments[1];
                    eachArgs = arguments[2];
                    fn = arguments[3];
                }


                avril.isArray(eachArgs).forEach(function(arg) {
                    var asyncArgs = standardiseArg(arg);
                    asyncArgs.slice(0,0,asyncCall);
                    ctx && asyncArgs.slice(0,0,ctx);
                    asyncArgs.push(fn);
                    cbFactory(isParal).apply(self, asyncArgs);
                });

                if(isParal){
                    self.func(function(){ });
                }
            };
        }

        var awaitData = {};
        this.$awaitData = function(key, value) {
            this.data.apply(this, arguments);
            if(awaitData[key]) {
                return awaitData[key];
            } else {
                awaitData[key] = new $AwaitData();
            }
            if(arguments.length == 2){
                awaitData[key].result(value);
            }
        };

        this.$await = cbFactory();

        this.$paralAwait = cbFactory(true);

        this.$each = eachCbFactory();

        this.$paralEach = eachCbFactory(true);

    }

    return function() {
        return new Queue();
    };

})();

/*
* avril control follow queue prototype
* super cool
* */
var q = module.exports();

q.callback(fs.readFile, 'filePath', function(err, fileContent) {
    this.$await(fs.readFile, fileContent.split('\n'), function(id){
        q.$ensure('ids', []);
        q.data('ids').push(id);
    });
    this.$each(db.findById, q.$awaitData('ids'), function(){

    });

    q.$if( q.$awaitData('ifTrue'), function() { } );

    var $arrayResult = q.$await(fs.readFile, 'the file path',function(err, file){

    });

    q.$if($arrayResult, function(){

    });

    q.$each($arrayResult, function(){

    });

    q.$switch($arrayResult, function(){

    });

    q.$each(q.$waitData())

    q.$if(q.$awaitData('dataName'), function () {
        q.data.ensure('data', []);
        q.$each(fs.readFile, ['path', 'array'], function(err, fileContent) {
            q.data('data').push(fileContent)
        });
    });

    q.$await()

});

q.eachCallback(fs.readFile, [
    'the',
    'path',
], function(err, fileContent, next, arg){

});

q.callback(db.findById, 'theId', function(err, doc, next, args){

});