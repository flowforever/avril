var assert = require("assert");

describe('avril.cache',function(){
	var avril = require('../index.js');
	var avCache = avril.cache;
	describe('#set()&get()',function(){
		it('should have key "hello world"',function(done){
			
			avCache.set('hello world', 'I am Judd Trump',function(){
				avCache.get('hello world',function(err,value){

					assert.equal( 'I am Judd Trump', value );

					done();
				});
			});

		});
	});

	describe('#del()',function(){
		it('hello world should be null',function(done){
			avCache.del('hello world',function(){
				avCache.get('hello world',function(err,value){

					assert.equal(null, value);

					done();	
				})
			});
		})

	})

	describe('#expire()',function(){
		var expireTestKey = 'expire test';
		avCache.set( expireTestKey , 'has value' , function(){
			avCache.expire(expireTestKey,3);
		});

		

		it('should be avaible within 3 seconds',function(done){
			this.timeout(3100);
			setTimeout(function(){
				avCache.get(expireTestKey,function(err,value){
					assert.equal('has value',value);
					done();
				});
			}, 2999);
		});

		it('should be expired after 3 seconds',function(done){
			this.timeout(3500);
			setTimeout(function(){
				avCache.get(expireTestKey,function(err,value){
					assert.equal(null,value);
					done();
				});
			},3100);
		});
	});

});