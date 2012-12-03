# yaryin

A scaffold framework to bring powerful support of layout and section for Express .
Support most template engine of Express .



## Installation
	
	npm install yaryin
## Begin to use yaryin
	var express = require('express');
	var app = express();

	var yaryin = require('yaryin');

	yaryin.initRootDir(__dirname);

	yaryin.extend( yaryin.Mvc.mvcConfig , {
		
	});

	yaryin.initComponent('mvc', { app: app, viewEngine: require('jshtml') });

	yaryin.extend(yaryin.getConfig('app') , process.env);

	app.listen(appConfig.port);

## Example
	use layout 
	you just need to add <!--layout(layoutName)--> at the front of your view .
	such as 
		<!--layoutName-->

	