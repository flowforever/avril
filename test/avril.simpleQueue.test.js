/**
 * Created by trump on 15-1-4.
 */
var assert = require("assert");
var avril = require('../index');

describe('avril.simpleQueue', function(){
    var ranTime = function(){
        return parseInt(5 * Math.random())
    };
    var readFile = function(path, callback){
        setTimeout(function(){
            callback(null, '123456789'.split('').join('\n'));
        },1)
    };

    var findById = function(id, callback) {
        var db = this.db || 'file';
        setTimeout(function(){
            callback(null, {
                id: id
                , name: 'user' + id
                , db: db
            });
        }, ranTime());
    };

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
                q.insertFunc(function(){
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

    describe('#$await & $each', function(){
        this.timeout(500000);

        it('users[2].name === "user2"', function(done){
            var q = avril.simpleQueue();

            q.$await( readFile, 'the/path/to/file.ext' , function(err, fileContent, arg){
                q.data('ids', fileContent.split('\n'));
            });

            q.$each({ db: 'sql' }, findById, q.$awaitData('ids'), function(err, user) {

                q.ensure('users',[]);

                q.data('users').push(user);

                user.friends = [];

                this.$each(findById, [ 11,12,13,14], function(err, friend) {
                    user.friends.push(friend);
                    friend.names = [];
                    this.$each(findById, [31,32,33], function(e, name){
                        friend.names.push(name);
                    })
                });

            });

            q.func(function(){
                assert.equal(q.data('users')[2].name, 'user3');
                assert.equal(q.data('users')[8].friends.length, 4);
                assert.equal(q.data('users')[8].friends[0].names.length, 3);
                assert.equal('sql', q.data('users')[0].db);
            });
			
			q.func(function(){done();});
        });

    });

    describe('#$paralAwait & $paralEach', function(){
        this.timeout(500000);

        it('users[2].name === "user2"', function(done){
            var q = avril.simpleQueue();
            
            q.$paralAwait(readFile, 'the/path/to/file.ext' , function(err, fileContent){
                q.data('ids', fileContent.split('\n'));
            });

            q.$paralEach({ db: 'mongodb' }, findById, q.$awaitData('ids'), function(err, user, arg) {
                q.ensure('users',[]);
                var id = arg[0];
                q.data('users')[ q.data('ids').indexOf(id) ] = user;
                user.friends = [];

                this.$paralEach(findById, [ 11,12,13,14], function(err, friend) {
                    //console.log('user:',user.id,friend.id);
                    user.friends.push(friend);
                    friend.names = [];
                    this.$paralEach(findById, [31,32,33], function(e, name){
                        friend.names.push(name);
                    })
                });
            });

            q.func(function(){
                assert.equal(q.id , this._pid);
                assert.equal(q.data('users')[2].name, 'user3');
                assert.equal(q.data().users[8].friends[0].names.length, 3);
                assert.equal('mongodb', q.data().users[0].db);
            });

            var $userIds = q.$await(readFile, 'the/path.txt', function(err, fileContent){ return fileContent.split('\n') });

            var $userList = q.$each(findById, $userIds, function(err, user){ return user; });

            var $userIdsFromUserList = $userList.conver(function($org){
                return $org.result().map(function($u){ 
                    return  $u.result().id ; 
                });
            });

            q.func(function(){

                assert.equal($userIds.result().length , 9);
                
                assert.equal($userIdsFromUserList.result().length , 9);
                
                assert.equal( $userList.realResult().length , 9 );

                assert.equal($userIdsFromUserList.result().length , 9);

                assert.equal($userIdsFromUserList.result().length , 9);

                assert.equal($userIds.result().length , 9);

                done();
            });

        });

    });

});