module.exports = {
	index:function(req,res,next,helper){
		res.view();
	}
	, 'myaccount[auth=true]':function(req,res,next,helper){
		res.view();
	}
};