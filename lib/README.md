avril
======

avril node mvc framework providers layout and partial support for application based on ExpressJs without concern about the Express version , and it's much more powerful than the orginal.

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

	avril.extend(avril.mvc.Mvc.config, {
		controller_dir_name: 'controllers',
		view_dir_name: 'views',
		area_dir_name: 'areas',
		share_dir_name: 'shares',
		viewExtension: '.cshtml'
	});

	avril.initComponent('mvc', { app: app, viewEngine: require('jshtml') });

	avril.extend(avril.getConfig('app') , process.env);

	app.listen(appConfig.port);

## Example
	use layout 
	you just need to add <!--layout(layoutName)--> at the front of your view .
	such as view : index.cshtml
		<!--layout(layout)-->
		<div>
			Index Content here
		</div>
		<!--sectionStart(menu)-->
		<ul>
			<li href="####">I am a menu 0</li>
			<li href="####">I am a menu 1</li>
			<li href="####">I am a menu 2</li>
		</ul>
		<!--sectionEnd(menu)-->



	layout.cshtml
		<div>
			<div class="menu">
				<!--section(menu)-->
			</div>
			<!--body()-->
		</div>