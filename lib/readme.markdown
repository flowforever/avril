# avril

A scaffold framework to bring powerful support of layout and section for Express .
Support most template engine of Express .



## Installation
	
	npm install avril
## Begin to use avril
	var express = require('express');
	var app = express();

	var avril = require('avril');

	avril.initRootDir(__dirname);

	avril.extend( avril.Mvc.mvcConfig , {
		
	});

	avril.initComponent('mvc', { app: app, viewEngine: require('jshtml') });

	avril.extend(avril.getConfig('app') , process.env);

	app.listen(appConfig.port);

## Example
	use layout 
	you just need to add <!--layout(layoutName)--> at the front of your view .
	such as 
		<!--layoutName-->

	