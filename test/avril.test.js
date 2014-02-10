var assert = require("assert");

describe('avril', function () {
    var avril = require('../index.js');

    avril.initRootDir(__dirname);


    describe('avril#extend()',function(){
    	it("a.sp1 should be 'bsp1value',  a = { p1:'0', p2:{ sp1:'asp1Value' } } , b = { p2: {sp1:'bsp1Value'}}" , function(){
    		var  a = { p1:'0', p2:{ sp1:'asp1Value' } } , b = { p2: {sp1:'bsp1Value'}};

    		avril.extend(a,b);

    		assert.equal( a.p2.sp1, b.p2.sp1  );

    	} );
    })


})