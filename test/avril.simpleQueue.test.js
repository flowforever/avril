/**
 * Created by trump on 15-1-4.
 */
var assert = require("assert");
var avril = require('../index');

describe('avril.simpleQueue', function(){
    describe('#func', function(){
        it('should execute 3 times', function(){
            var q1 = avril.simpleQueue();
            var counter = 0;
            q1.func(function(){ counter++; });
            q1.func(function(){ counter++; });
            q1.func(function(){
                counter++;
                assert(counter, 3);
            });
        });
    });

    describe('#paralFunc', function(){
        it('should execute 3 times', function(done){
            var q1 = avril.simpleQueue();
            var counter = 0;
            var paralObj = q1.paralFunc();

            paralObj.paralFunc(function(){ counter++; });
            paralObj.paralFunc(function(){ counter++; });
            paralObj.paralFunc(function(){
                counter++;
            });
            paralObj.func(function(){
                assert(counter, 3);
                done();
            });

        });

        it('should cost 1 second', function(){

        })
    });

    describe('#data', function(done){
        it('data1 should be data1', function(){
            var q = avril.simpleQueue();
            q.paralFunc(function(next){
                setTimeout(function(){
                    q.data('data1', 'data1');
                    next();
                },100);
            });
            q.paralFunc(function(next){
                setTimeout(function(){
                    q.data('data2', 'data2');
                    next();
                },140);
            });
            q.paralFunc(function(next){
                setTimeout(function(){
                    q.data('data3', 'data3');
                    next();
                },130);
            });
            q.func(function(){
                assert(q.data('data1'), 'data1');
                assert(Object.keys(q.data()).length , 3);
            });
        });
    });

    describe('#insertFunc', function(){
        it('should executed correct', function(){
            var q = avril.simpleQueue();
            var counter = 0;
            q.func(function(next, task) {
                counter++;
                q.insertFunc(task, function(){
                    assert.equal(counter, 1);
                    counter++;
                });
                q.insertFunc(task, function(){
                    assert.equal(counter, 2);
                    counter++;
                });
                next();
            });
            q.func(function(){
                assert.equal(counter, 3);
            });
        });
    });

    describe('#paralFunc #func', function(){
        this.timeout(5000);
        it('paralFunc should be fast', function(done) {
            var mainQueue = avril.simpleQueue();
            var t1 = 0, t2 = 0;
            mainQueue.func(function func(next){
                var q = avril.simpleQueue();
                var now = Date.now();
                q.func(function(next1){
                    setTimeout(next1,1000);
                });
                q.func(function(next1){
                    setTimeout(next1,1000);
                });
                q.func(function(){
                    t1 = Date.now() - now;
                    assert(t1, 0);
                    next();
                });
            });
            mainQueue.func(function paralFunc(next){
                var q = avril.simpleQueue();
                var now = Date.now();
                q.paralFunc(function(next1) {
                    setTimeout(next1,1000);
                });
                q.paralFunc(function(next1){
                    setTimeout(next1,1000);
                });
                q.func(function(){
                    t2 = Date.now() - now;
                    next();
                });
            });

            mainQueue.func(function() {
                assert.equal(true, t1 > t2 );
                assert.equal( parseInt( t1/1000) , 2 );
                assert.equal( parseInt( t2/1000) , 1 );
                done();
            });
        });
    });

    describe('#$await', function(){
        this.timeout(5000);

        it('users[2].name === "user2"', function(done){
            var q = avril.simpleQueue();
            var readFile = function(path, callback){
                setTimeout(function(){
                    callback(null, '123456789'.split('').join('\n'));
                },100)
            };
            var findById = function(id, callback) {
                setTimeout(function(){
                    callback(null, {
                        id: id
                        , name: 'user' + id
                    });
                },102);
            };

            q.$await(readFile, 'the/path/to/file.ext' , function(err, fileContent){
                q.data('ids', fileContent.split('\n'));
            });

            q.$each(findById, q.$awaitData('ids'), function(err, user) {
                q.ensure('users',[]);
                q.data('users').push(user);
            });

            q.func(function(){
                assert.equal(q.data('users')[2].name, 'user2');
            });

            q.func(done);
        });

    })
});