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
})