"use strict";

window.gtd.Pattern.Pattern = Backbone.Model.extend({

	
	defaults : {
		/* id: -1, */
		'from' : null,
		'subject' : null,
		'summary' : null,
		'content' : null,
		'type' : null,
		'action': null,
		'ediatable' : true,
		'insensitive'  : true,
		'value' : ''
	}
	
});